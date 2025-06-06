export const NotificationType = {
    ORDER_STATUS_CHANGE: 'ORDER_STATUS_CHANGE',
    NEW_ORDER: 'NEW_ORDER',
    ACCOUNT_UPDATE: 'ACCOUNT_UPDATE',
    SYSTEM_ALERT: 'SYSTEM_ALERT',
    PROMOTION: 'PROMOTION'
    // Add more types as needed without updating DB schema
  };
  
  export type NotificationTypeValues = 
    | 'ORDER_CREATED'
    | 'LOW_STOCK'
    | 'ORDER_STATUS_CHANGED'
    | 'ORDER_STATUS_CHANGE'
    | 'NEW_ORDER'
    | 'ACCOUNT_UPDATE'
    | 'SYSTEM_ALERT'
    | 'INFO'
    | 'SUCCESS'
    | 'PROMOTION';