import { ActionType, AuditLogEntry } from "@entities/audit-log-entry";
import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class AuditLog {
    static readonly logger = new Logger(AuditLog.name, false);

    static async log(
        actionType: ActionType,
        type: string,
        userId: number,
        name: string = null,
        id: number = null,
        completed = false
    ): Promise<void> {
        const auditLogEntry: AuditLogEntry = {
            userId: userId,
            timestamp: new Date(),
            actionType: actionType,
            type: type,
            id: id,
            name: name,
            completed: completed,
        };
        this.logger.log(JSON.stringify(auditLogEntry));
    }

    static async success(
        actionType: ActionType,
        type: string,
        userId: number,
        name: string = null,
        id: number = null
    ): Promise<void> {
        this.log(actionType, type, userId, name, id, true);
    }

    static async fail(
        actionType: ActionType,
        type: string,
        userId: number,
        name: string = null,
        id: number = null
    ): Promise<void> {
        this.log(actionType, type, userId, name, id, false);
    }
}