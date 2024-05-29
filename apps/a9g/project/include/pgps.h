#ifndef __PGPS_H_
#define __PGPS_H_

// Include the API header file
#include "api_os.h"
#include "api_event.h"

// Define the network task parameters
#define PGPS_TASK_STACK_SIZE (2048 * 2)
#define PGPS_TASK_PRIORITY 1
#define PGPS_TASK_NAME "GPS Task"

// Define the network task event
extern HANDLE gpsTaskHandle;

// Define shared variables

// Define shared functions
bool AttachActivate();
void GPSEventDispatch(API_Event_t *pEvent);

// Define the network task
void gpsTask(void *param);

#endif
