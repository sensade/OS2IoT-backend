import { ApiProperty } from "@nestjs/swagger";

export class ListAllIoTDevicesMinimalResponseDto {
    @ApiProperty()
    data: IoTDeviceMinimal[];
    @ApiProperty()
    count: number;
}

export class IoTDeviceMinimal {
    id: number;

    name: string;

    canRead: boolean;

    organizationId: number;

    lastActiveTime: Date;
}

export class IoTDeviceMinimalRaw {
    id: number;

    name: string;

    applicationId: number;

    organizationId: number;

    sentTime: Date;
}
