import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
  } from '@nestjs/websockets';
  import { Server, Socket } from 'socket.io';
  import { JwtService } from '@nestjs/jwt';
  
  @WebSocketGateway({
    cors: {
      origin: 'http://localhost:5173',
      methods: ["GET", "POST"],
      credentials: true
    },
  })
  export class NotificationsGateway
    implements OnGatewayConnection, OnGatewayDisconnect
  {
    @WebSocketServer()
    server: Server;
  
    private connectedClients = new Map<string, string[]>(); // userId -> socketIds[]
  
    constructor(private jwtService: JwtService) {}
  
    async handleConnection(client: Socket) {
      try {
        const token = client.handshake.auth.token?.split(' ')[1] || 
                      client.handshake.headers.authorization?.split(' ')[1];
                      
        if (!token) {
          client.disconnect();
          return;
        }
  
        const decoded = this.jwtService.verify(token);
        const userId = decoded.sub;
  
        // Store the connection
        const existingConnections = this.connectedClients.get(userId) || [];
        this.connectedClients.set(userId, [...existingConnections, client.id]);
  
        // Join a room specific to this user
        client.join(`user-${userId}`);
        
        console.log(`Client connected: ${client.id} for user: ${userId}`);
      } catch (error) {
        console.error('WebSocket connection error:', error);
        client.disconnect();
      }
    }
  
    handleDisconnect(client: Socket) {
      // Remove the client from our tracking
      this.connectedClients.forEach((socketIds, userId) => {
        const updatedSocketIds = socketIds.filter(id => id !== client.id);
        if (updatedSocketIds.length === 0) {
          this.connectedClients.delete(userId);
        } else {
          this.connectedClients.set(userId, updatedSocketIds);
        }
      });
      
      console.log(`Client disconnected: ${client.id}`);
    }
  
    sendNotificationToUser(userId: string, notification: any) {
      this.server.to(`user-${userId}`).emit('notification', notification);
    }
  
    sendNotificationToAll(notification: any) {
      this.server.emit('system-notification', notification);
    }
  }