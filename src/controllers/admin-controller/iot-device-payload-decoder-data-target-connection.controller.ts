import {
    Controller,
    Get,
    Query,
    Post,
    Body,
    Param,
    Put,
    Delete,
    NotFoundException,
    UseGuards,
    Req,
    ParseIntPipe,
} from "@nestjs/common";
import { IoTDevicePayloadDecoderDataTargetConnectionService } from "@services/iot-device-payload-decoder-data-target-connection.service";
import { ListAllConnectionsReponseDto } from "@dto/list-all-connections-response.dto";
import { ListAllEntitiesDto } from "@dto/list-all-entities.dto";
import {
    ApiProduces,
    ApiOperation,
    ApiResponse,
    ApiTags,
    ApiBadRequestResponse,
    ApiNotFoundResponse,
    ApiBearerAuth,
    ApiForbiddenResponse,
    ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { ListAllApplicationsReponseDto } from "@dto/list-all-applications-response.dto";
import { CreateIoTDevicePayloadDecoderDataTargetConnectionDto } from "@dto/create-iot-device-payload-decoder-data-target-connection.dto";
import { IoTDevicePayloadDecoderDataTargetConnection } from "@entities/iot-device-payload-decoder-data-target-connection.entity";
import { UpdateIoTDevicePayloadDecoderDataTargetConnectionDto } from "@dto/update-iot-device-payload-decoder-data-target-connection.dto";
import { DeleteResponseDto } from "@dto/delete-application-response.dto";
import { ErrorCodes } from "@enum/error-codes.enum";
import { JwtAuthGuard } from "@auth/jwt-auth.guard";
import { RolesGuard } from "@auth/roles.guard";
import { Read, Write } from "@auth/roles.decorator";
import { AuthenticatedRequest } from "@dto/internal/authenticated-request";
import { checkIfUserHasWriteAccessToApplication } from "@helpers/security-helper";
import { IoTDeviceService } from "@services/iot-device.service";

@ApiTags("IoT-Device, PayloadDecoder and DataTarget Connection")
@Controller("iot-device-payload-decoder-data-target-connection")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Read()
@ApiForbiddenResponse()
@ApiUnauthorizedResponse()
export class IoTDevicePayloadDecoderDataTargetConnectionController {
    constructor(
        private service: IoTDevicePayloadDecoderDataTargetConnectionService,
        private iotDeviceService: IoTDeviceService
    ) {}

    @Get()
    @ApiProduces("application/json")
    @ApiOperation({
        summary:
            "Find all connections between IoT-Devices, PayloadDecoders and DataTargets (paginated)",
    })
    @ApiResponse({
        status: 200,
        description: "Success",
        type: ListAllApplicationsReponseDto,
    })
    async findAll(
        @Req() req: AuthenticatedRequest,
        @Query() query?: ListAllEntitiesDto
    ): Promise<ListAllConnectionsReponseDto> {
        if (req.user.permissions.isGlobalAdmin) {
            return await this.service.findAndCountWithPagination(query);
        } else {
            const allowed = req.user.permissions.getAllApplicationsWithAtLeastRead();
            return await this.service.findAndCountWithPagination(query, allowed);
        }
    }

    @Get(":id")
    @ApiNotFoundResponse({
        description: "If the id of the entity doesn't exist",
    })
    async findOne(
        @Req() req: AuthenticatedRequest,
        @Param("id", new ParseIntPipe()) id: number
    ): Promise<IoTDevicePayloadDecoderDataTargetConnection> {
        return await this.service.findOne(id);
    }

    @Get("byIoTDevice/:id")
    @ApiOperation({
        summary: "Find all connections by IoT-Device id",
    })
    async findByIoTDeviceId(
        @Req() req: AuthenticatedRequest,
        @Param("id", new ParseIntPipe()) id: number
    ): Promise<ListAllConnectionsReponseDto> {
        if (req.user.permissions.isGlobalAdmin) {
            return await this.service.findAllByIoTDeviceId(id);
        } else {
            return await this.service.findAllByIoTDeviceId(
                id,
                req.user.permissions.getAllApplicationsWithAtLeastRead()
            );
        }
    }

    @Get("byPayloadDecoder/:id")
    @ApiOperation({
        summary: "Find all connections by PayloadDecoder id",
    })
    async findByPayloadDecoderId(
        @Req() req: AuthenticatedRequest,
        @Param("id", new ParseIntPipe()) id: number
    ): Promise<ListAllConnectionsReponseDto> {
        if (req.user.permissions.isGlobalAdmin) {
            return await this.service.findAllByPayloadDecoderId(id);
        } else {
            return await this.service.findAllByPayloadDecoderId(
                id,
                req.user.permissions.getAllOrganizationsWithAtLeastRead()
            );
        }
    }

    @Get("byDataTarget/:id")
    @ApiOperation({
        summary: "Find all connections by DataTarget id",
    })
    async findByDataTargetId(
        @Req() req: AuthenticatedRequest,
        @Param("id", new ParseIntPipe()) id: number
    ): Promise<ListAllConnectionsReponseDto> {
        if (req.user.permissions.isGlobalAdmin) {
            return await this.service.findAllByDataTargetId(id);
        } else {
            const allowed = req.user.permissions.getAllApplicationsWithAtLeastRead();
            return await this.service.findAllByDataTargetId(id, allowed);
        }
    }

    @Post()
    @Write()
    @ApiOperation({
        summary: "Create new connection",
    })
    @ApiBadRequestResponse({
        description: "If one or more of the id's are invalid references.",
    })
    async create(
        @Req() req: AuthenticatedRequest,
        @Body()
        createDto: CreateIoTDevicePayloadDecoderDataTargetConnectionDto
    ): Promise<IoTDevicePayloadDecoderDataTargetConnection> {
        await this.checkUserHasWriteAccessToAllIotDevices(createDto.iotDeviceIds, req);
        return await this.service.create(createDto);
    }

    private async checkUserHasWriteAccessToAllIotDevices(
        ids: number[],
        req: AuthenticatedRequest
    ) {
        const iotDevices = await this.iotDeviceService.findManyByIds(ids);
        iotDevices.forEach(x => {
            checkIfUserHasWriteAccessToApplication(req, x.application.id);
        });
    }

    @Put(":id")
    @Write()
    @ApiNotFoundResponse({
        description: "If the id of the entity doesn't exist",
    })
    @ApiBadRequestResponse({
        description: "If one or more of the id's are invalid references.",
    })
    async update(
        @Req() req: AuthenticatedRequest,
        @Param("id", new ParseIntPipe()) id: number,
        @Body()
        updateDto: UpdateIoTDevicePayloadDecoderDataTargetConnectionDto
    ): Promise<IoTDevicePayloadDecoderDataTargetConnection> {
        const newIotDevice = await this.iotDeviceService.findOne(
            updateDto.iotDeviceIds[0]
        );
        checkIfUserHasWriteAccessToApplication(req, newIotDevice.application.id);
        const oldConnection = await this.service.findOne(id);
        await this.checkUserHasWriteAccessToAllIotDevices(updateDto.iotDeviceIds, req);
        const oldIds = oldConnection.iotDevices.map(x => x.id);
        if (updateDto.iotDeviceIds != oldIds) {
            await this.checkUserHasWriteAccessToAllIotDevices(oldIds, req);
        }
        return await this.service.update(id, updateDto);
    }

    @Delete(":id")
    @Write()
    @ApiNotFoundResponse({
        description: "If the id of the entity doesn't exist",
    })
    async delete(
        @Req() req: AuthenticatedRequest,
        @Param("id", new ParseIntPipe()) id: number
    ): Promise<DeleteResponseDto> {
        const oldConnection = await this.service.findOne(id);
        await this.checkUserHasWriteAccessToAllIotDevices(
            oldConnection.iotDevices.map(x => x.id),
            req
        );
        try {
            const result = await this.service.delete(id);

            if (result.affected === 0) {
                throw new NotFoundException(ErrorCodes.IdDoesNotExists);
            }
            return new DeleteResponseDto(result.affected);
        } catch (err) {
            throw new NotFoundException(err);
        }
    }
}
