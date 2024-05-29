#ifndef __NETWORK_H_
#define __NETWORK_H_

// Include the API header file
#include "api_os.h"
#include "api_event.h"

// Define the network task parameters
#define NETWORK_TASK_STACK_SIZE (2048 * 2)
#define NETWORK_TASK_PRIORITY 1
#define NETWORK_TASK_NAME "Network Task"

// Define the PDP context parameters
#define PDP_CONTEXT_APN "zap.vivo.com.br"
#define PDP_CONTEXT_USERNAME "vivo"
#define PDP_CONTEXT_PASSWD "vivo"

// Define the network task event
extern HANDLE NetworkTaskHandle;

// Define shared variables
extern bool hasNetwork;

// Define shared functions
bool AttachActivate();
void NetworkEventDispatch(API_Event_t *pEvent);

// Define the network task
void NetworkTestTask(void *param);

#endif
