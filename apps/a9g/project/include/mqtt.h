#ifndef __MQTT_H_
#define __MQTT_H_

// Include the API header file
#include "api_os.h"
#include "api_event.h"

// Define the network task parameters
#define MQTT_TASK_STACK_SIZE (2048 * 2)
#define MQTT_TASK_PRIORITY 2
#define MQTT_TASK_NAME "MQTT Task"

// Define the MQTT task parameters
#define BROKER_IP "unibus.tech"
#define BROKER_PORT 1883
#define CLIENT_USER "BRA2E19"
#define CLIENT_PASS "12345678"
#define SUBSCRIBE_TOPIC "BRA2E19"
#define PUBLISH_TOPIC "BRA2E19"

// Define structures and enumerations
typedef enum
{
    MQTT_EVENT_CONNECTED = 0,
    MQTT_EVENT_DISCONNECTED,
    MQTT_EVENT_MAX
} MQTT_Event_ID_t;

typedef struct
{
    MQTT_Event_ID_t id;
    MQTT_Client_t *client;
} MQTT_Event_t;

typedef enum
{
    MQTT_STATUS_DISCONNECTED = 0,
    MQTT_STATUS_CONNECTED,
    MQTT_STATUS_MAX
} MQTT_Status_t;

// Define the mqtt task event
extern HANDLE mqttTaskHandle;

// Define shared variables
extern MQTT_Client_t *client;
extern MQTT_Status_t mqttStatus;

// Define shared functions
void mqttEventDispatch(API_Event_t *pEvent);
void mqttPublish(void *param, const char *payload);

// Define the network task
void mqttTask(void *param);

#endif
