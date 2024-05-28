// network.h
#ifndef __NETWORK_H_
#define __NETWORK_H_

#include "api_os.h"
#include "api_event.h"

#define PDP_CONTEXT_APN "zap.vivo.com.br"
#define PDP_CONTEXT_USERNAME "vivo"
#define PDP_CONTEXT_PASSWD "vivo"

#define NETWORK_TASK_STACK_SIZE (2048 * 2)
#define NETWORK_TASK_PRIORITY 2
#define NETWORK_TASK_NAME "Network Task"

extern HANDLE NetworkTaskHandle;

bool AttachActivate();
void NetworkEventDispatch(API_Event_t *pEvent);
void NetworkTestTask(void *param);

#endif
