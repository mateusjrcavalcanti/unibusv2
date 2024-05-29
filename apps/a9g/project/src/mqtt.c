// Include SDK libraries
#include "stdbool.h"
#include "stdint.h"
#include "stdio.h"
#include "string.h"

#include "api_os.h"
#include "api_debug.h"
#include "api_event.h"
#include "api_mqtt.h"
#include "api_network.h"
#include "api_socket.h"
#include "api_info.h"

// Include the project libraries
#include "network.h"
#include "mqtt.h"

// Define the mqtt task event
HANDLE mqttTaskHandle = NULL;

// Define shared variables
MQTT_Client_t *client = NULL;
MQTT_Status_t mqttStatus = MQTT_STATUS_DISCONNECTED;

// Define local variables
uint8_t imei[16] = "";
MQTT_Connect_Info_t ci;
static uint32_t reconnectInterval = 3000;

/* ===[ Define mqtt functions here ]=== */

void mqttEventDispatch(API_Event_t *pEvent)
{
    switch (pEvent->id)
    {

    default:
        break;
    }
}

void OnMqttReceived(void *arg, const char *topic, uint32_t payloadLen)
{
    Trace(1, "[MQTT] RECEIVED PUBLISH DATA REQUEST, TOPIC:%s, PAYLOAD LENGTH:%d", topic, payloadLen);
}

void OnMqttReceiedData(void *arg, const uint8_t *data, uint16_t len, MQTT_Flags_t flags)
{
    Trace(1, "[MQTT] RECEIVED PUBLISH DATA, LENGTH:%d, DATA:%s", len, data);
    if (flags == MQTT_FLAG_DATA_LAST)
        Trace(1, "[MQTT] DATA IS LAST FRAME");
}

void OnMqttSubscribed(void *arg, MQTT_Error_t err)
{
    if (err != MQTT_ERROR_NONE)
        Trace(1, "[MQTT] SUBSCRIBE FAIL, ERROR CODE:%d", err);
    else
        Trace(1, "[MQTT] SUBSCRIBE SUCCESS, TOPIC:%s", (const char *)arg);
}

void OnMqttConnection(MQTT_Client_t *client, void *arg, MQTT_Connection_Status_t status)
{
    Trace(1, "[MQTT] CONNECTION STATUS:%d", status);
    MQTT_Event_t *event = (MQTT_Event_t *)OS_Malloc(sizeof(MQTT_Event_t));
    if (!event)
    {
        Trace(1, "[MQTT] ERROR: MALLOC EVENT FAILED BECAUSE OF NO MEMORY");
        return;
    }
    if (status == MQTT_CONNECTION_ACCEPTED)
    {
        Trace(1, "[MQTT] SUCCESSFULLY CONNECTED TO BROKER");
        event->id = MQTT_EVENT_CONNECTED;
        event->client = client;
        OS_SendEvent(mqttTaskHandle, event, OS_TIME_OUT_WAIT_FOREVER, OS_EVENT_PRI_NORMAL);
    }
    else
    {
        event->id = MQTT_EVENT_DISCONNECTED;
        event->client = client;
        OS_SendEvent(mqttTaskHandle, event, OS_TIME_OUT_WAIT_FOREVER, OS_EVENT_PRI_NORMAL);
        Trace(1, "[MQTT] ERROR: FAILED TO CONNECT TO BROKER, ERROR CODE:%d", status);
    }
    Trace(1, "[MQTT] CONNECTION STATUS:%d", status);
}

void OnPublish(void *arg, MQTT_Error_t err)
{
    if (err == MQTT_ERROR_NONE)
        Trace(1, "[MQTT] PUBLISH SUCCESS");
    else
        Trace(1, "[MQTT] ERROR: PUBLISH FAILED, ERROR CODE:%d", err);
}

void mqttPublish(void *param, const char *payload)
{
    MQTT_Error_t err;
    MQTT_Client_t *client = (MQTT_Client_t *)param;
    uint8_t status = MQTT_IsConnected(client);
    Trace(1, "[MQTT] STATUS:%d", status);
    if (status != MQTT_STATUS_CONNECTED)
    {
        Trace(1, "[MQTT] NOT CONNECTED TO BROKER, CAN NOT PUBLISH");
        return;
    }
    Trace(1, "[MQTT] PUBLISHING TO TOPIC:%s, PAYLOAD:%s", PUBLISH_TOPIC, payload);
    err = MQTT_Publish(client, PUBLISH_TOPIC, payload, strlen(payload), 1, 2, 0, OnPublish, NULL);
    if (err != MQTT_ERROR_NONE)
        Trace(1, "[MQTT] ERROR: FAILED TO PUBLISH, ERROR CODE:%d", err);
}

void OnTimerStartConnect(void *param)
{
    MQTT_Error_t err;
    MQTT_Client_t *client = (MQTT_Client_t *)param;
    uint8_t status = MQTT_IsConnected(client);
    Trace(1, "[MQTT] STATUS:%d", status);
    if (mqttStatus == MQTT_STATUS_CONNECTED)
    {
        Trace(1, "[MQTT] ALREADY CONNECTED TO BROKER");
        return;
    }
    err = MQTT_Connect(client, BROKER_IP, BROKER_PORT, OnMqttConnection, NULL, &ci);
    if (err != MQTT_ERROR_NONE)
    {
        Trace(1, "[MQTT] RECONNECTING TO BROKER IN %d MILLISECONDS, ERROR CODE:%d", reconnectInterval, err);
        reconnectInterval += 1000;
        if (reconnectInterval >= 60000)
            reconnectInterval = 60000;
        StartTimerConnect(reconnectInterval, client);
    }
}

void StartTimerConnect(uint32_t interval, MQTT_Client_t *client)
{
    OS_StartCallbackTimer(mqttTaskHandle, interval, OnTimerStartConnect, (void *)client);
}

void mqttTaskEventDispatch(MQTT_Event_t *pEvent)
{
    switch (pEvent->id)
    {
    case MQTT_EVENT_CONNECTED:
        reconnectInterval = 3000;
        mqttStatus = MQTT_STATUS_CONNECTED;
        Trace(1, "[MQTT] SUBSCRIBING TO TOPIC:%s", SUBSCRIBE_TOPIC);
        MQTT_Error_t err;
        MQTT_SetInPubCallback(pEvent->client, OnMqttReceived, OnMqttReceiedData, NULL);
        err = MQTT_Subscribe(pEvent->client, SUBSCRIBE_TOPIC, 2, OnMqttSubscribed, (void *)SUBSCRIBE_TOPIC);
        if (err != MQTT_ERROR_NONE)
            Trace(1, "[MQTT] SUBSCRIBE FAIL, ERROR CODE:%d", err);
        break;
    case MQTT_EVENT_DISCONNECTED:
        mqttStatus = MQTT_STATUS_DISCONNECTED;
        StartTimerConnect(reconnectInterval, pEvent->client);
        break;
    default:
        break;
    }
}

void mqttTask(void *pData)
{
    MQTT_Event_t *event = NULL;

    while (!hasNetwork)
    {
        Trace(1, "[MQTT] Waiting for network registration");
        OS_Sleep(2000);
    }

    Trace(1, "[MQTT] START MQTT TASK");

    INFO_GetIMEI(imei);
    Trace(1, "[MQTT] IMEI:%s", imei);

    client = MQTT_ClientNew();

    MQTT_Error_t err;
    memset(&ci, 0, sizeof(MQTT_Connect_Info_t));
    ci.client_id = imei;
    ci.client_user = CLIENT_USER;
    ci.client_pass = CLIENT_PASS;
    ci.keep_alive = 20;
    ci.clean_session = 1;
    ci.use_ssl = false;
    ci.will_qos = 2;
    ci.will_topic = "will";
    ci.will_retain = 1;
    ci.will_msg = imei;

    err = MQTT_Connect(client, BROKER_IP, BROKER_PORT, OnMqttConnection, NULL, &ci);
    if (err != MQTT_ERROR_NONE)
        Trace(1, "[MQTT] ERROR: FAILED TO CONNECT TO BROKER, ERROR CODE:%d", err);

    while (1)
    {
        if (OS_WaitEvent(mqttTaskHandle, (void **)&event, OS_TIME_OUT_WAIT_FOREVER))
        {
            mqttTaskEventDispatch(event);
            OS_Free(event);
        }
    }
}
