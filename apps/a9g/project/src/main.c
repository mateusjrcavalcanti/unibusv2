

// Include SDK libraries
#include <string.h>
#include <stdio.h>
#include <api_os.h>
#include <api_event.h>
#include <api_network.h>
#include <api_debug.h>

// Include the project libraries
#include "main.h"
#include "network.h"
#include "pgps.h"
#include "mqtt.h"

// Define the main task event
HANDLE mainTaskHandle = NULL;

static void EventDispatch(API_Event_t *pEvent)
{
    switch (pEvent->id)
    {
    // SYSTEM
    case API_EVENT_ID_SYSTEM_READY:
        Trace(2, "API_EVENT_ID_SYSTEM_READY");
        break;
    // SIM card
    case API_EVENT_ID_NO_SIMCARD:
        Trace(2, "API_EVENT_ID_SIMCARD: %d", pEvent->param1);
        hasNetwork = false;
        break;
    case API_EVENT_ID_SIMCARD_DROP:
        Trace(2, "API_EVENT_ID_SIMCARD_DROP: %d", pEvent->param1);
        break;
    // SIGNAL
    case API_EVENT_ID_SIGNAL_QUALITY:
        Trace(2, "API_EVENT_ID_SIGNAL_QUALITY: [%d] SQ(0~31,99(unknown)), [%d] RXQUAL(0~7,99(unknown)) [%d] (RSSI = SQ*2-113)", pEvent->param1, pEvent->param2, pEvent->param1 * 2 - 113);
        break;
    default:
        break;
    }
}

void MainTask(void *pData)
{
    API_Event_t *event = NULL;

    // NetworkTaskHandle = OS_CreateTask(NetworkTestTask, NULL, NULL, NETWORK_TASK_STACK_SIZE, NETWORK_TASK_PRIORITY, 0, 0, NETWORK_TASK_NAME);

    gpsTaskHandle = OS_CreateTask(gpsTask,
                                  NULL, NULL, PGPS_TASK_STACK_SIZE, PGPS_TASK_PRIORITY, 0, 0, PGPS_TASK_NAME);

    // MQTT Task
    mqttTaskHandle = OS_CreateTask(mqttTask,
                                   NULL, NULL, MQTT_TASK_STACK_SIZE, MQTT_TASK_PRIORITY, 0, 0, MQTT_TASK_NAME);

    while (1)
    {
        if (OS_WaitEvent(mainTaskHandle, (void **)&event, OS_TIME_OUT_WAIT_FOREVER))
        {
            EventDispatch(event);
            NetworkEventDispatch(event);
            GPSEventDispatch(event);
            OS_Free(event->pParam1);
            OS_Free(event->pParam2);
            OS_Free(event);
        }
    }
}

void unibus_Main(void)
{
    mainTaskHandle = OS_CreateTask(MainTask,
                                   NULL, NULL, MAIN_TASK_STACK_SIZE, MAIN_TASK_PRIORITY, 0, 0, MAIN_TASK_NAME);
    OS_SetUserMainHandle(&mainTaskHandle);
}
