import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    InternalServerErrorException,
    Logger,
    NotFoundException,
    Param,
    Post,
    Put,
    Query,
    UseGuards,
} from "@nestjs/common";
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiNotFoundResponse,
    ApiOperation,
    ApiProduces,
    ApiTags,
} from "@nestjs/swagger";

import { JwtAuthGuard } from "@auth/jwt-auth.guard";
import { Read, Write } from "@auth/roles.decorator";
import { RolesGuard } from "@auth/roles.guard";
import { CreateChirpstackProfileResponseDto } from "@dto/chirpstack/create-chirpstack-profile-response.dto";
import { CreateDeviceProfileDto } from "@dto/chirpstack/create-device-profile.dto";
import { ListAllDeviceProfilesReponseDto } from "@dto/chirpstack/list-all-device-profiles-response.dto";
import { UpdateDeviceProfileDto } from "@dto/chirpstack/update-device-profile.dto";
import { DeleteResponseDto } from "@dto/delete-application-response.dto";
import { ErrorCodes } from "@enum/error-codes.enum";
import { DeviceProfileService } from "@services/chirpstack/device-profile.service";

@ApiTags("Chirpstack")
@Controller("chirpstack/device-profiles")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Write()
export class DeviceProfileController {
    constructor(private deviceProfileService: DeviceProfileService) {}

    @Post()
    @ApiProduces("application/json")
    @ApiOperation({ summary: "Create a new DeviceProfile" })
    @ApiBadRequestResponse()
    async create(
        @Body() createDto: CreateDeviceProfileDto
    ): Promise<CreateChirpstackProfileResponseDto> {
        const result = await this.deviceProfileService.createDeviceProfile(createDto);
        return result.data;
    }

    @Put(":id")
    @ApiProduces("application/json")
    @ApiOperation({ summary: "Update an existing DeviceProfile" })
    @ApiBadRequestResponse()
    @HttpCode(204)
    async update(
        @Param("id") id: string,
        @Body() updateDto: UpdateDeviceProfileDto
    ): Promise<void> {
        try {
            await this.deviceProfileService.updateDeviceProfile(updateDto, id);
        } catch (err) {
            Logger.error(`Error occured during put: '${JSON.stringify(err)}'`);
            throw new InternalServerErrorException(err?.response?.data);
        }
    }

    @Get(":id")
    @ApiProduces("application/json")
    @ApiOperation({ summary: "Find one DeviceProfile by id" })
    @ApiNotFoundResponse()
    @Read()
    async findOne(@Param("id") id: string): Promise<CreateDeviceProfileDto> {
        let result = undefined;

        try {
            result = await this.deviceProfileService.findOneDeviceProfileById(id);
        } catch (err) {
            Logger.error(`Error occured during get/:id : '${JSON.stringify(err)}'`);
        }
        if (!result) {
            throw new NotFoundException(ErrorCodes.IdDoesNotExists);
        }
        return result;
    }

    @Get()
    @ApiProduces("application/json")
    @ApiOperation({ summary: "Find all DeviceProfile" })
    @Read()
    async getAll(
        @Query("limit") limit: number,
        @Query("offset") offset: number
    ): Promise<ListAllDeviceProfilesReponseDto> {
        let result = undefined;
        try {
            Logger.debug(`Limit: '${limit}' Offset:'${offset}'`);
            result = await this.deviceProfileService.findAllDeviceProfiles(
                limit || 50,
                offset || 0
            );
        } catch (err) {
            Logger.error(
                `Error occured during Find all: '${JSON.stringify(err?.response?.data)}'`
            );
        }
        return result;
    }

    @Delete(":id")
    @ApiOperation({ summary: "Delete one DeviceProfile by id" })
    @ApiNotFoundResponse()
    async deleteOne(@Param("id") id: string): Promise<DeleteResponseDto> {
        let result = undefined;
        try {
            result = await this.deviceProfileService.deleteDeviceProfile(id);
        } catch (err) {
            Logger.error(
                `Error occured during delete: '${JSON.stringify(err?.response?.data)}'`
            );
            if (err?.message == "this object is used by other objects, remove them first") {
                throw new BadRequestException(ErrorCodes.IsUsed);
            }
        }

        if (!result) {
            throw new NotFoundException(ErrorCodes.IdDoesNotExists);
        }

        return new DeleteResponseDto(1);
    }
}
