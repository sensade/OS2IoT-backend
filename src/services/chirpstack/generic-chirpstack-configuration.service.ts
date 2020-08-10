import { Injectable, Logger, HttpService } from "@nestjs/common";
import { JwtToken } from "./jwt-token";
import { AuthorizationType } from "@enum/authorization-type.enum";
import { AxiosRequestConfig } from "axios";
import { HeaderDto } from "@dto/chirpstack/header.dto";

@Injectable()
export class GenericChirpstackConfigurationService {
    baseUrl = `http://${process.env.CHIRPSTACK_APPLICATION_SERVER_HOSTNAME ||
        "host.docker.internal"}:${process.env
        .CHIRPSTACK_APPLICATION_SERVER_PORT || "8080"}`;

    networkServer = `${process.env.CHIRPSTACK_NETWORK_SERVER ||
        "chirpstack-network-server"}:${process.env
        .CHIRPSTACK_NETWORK_SERVER_PORT || "8000"}`;
    constructor(private httpService: HttpService) {}

    setupHeader(endPoint: string, limit?: number, offset?: number): any {
        if (limit != null && offset != null) {
            const headerDto: HeaderDto = {
                url:
                    this.baseUrl +
                    "/api/" +
                    endPoint +
                    "?limit=" +
                    limit +
                    "&" +
                    offset +
                    "=0",
                timeout: 3000,
                authorizationType: AuthorizationType.HEADER_BASED_AUTHORIZATION,
                authorizationHeader: "Bearer " + JwtToken.setupToken(),
            };
            return {
                url:
                    this.baseUrl +
                    "/api/" +
                    endPoint +
                    "?limit=" +
                    limit +
                    "&" +
                    offset +
                    "=0",
                timeout: 3000,
                authorizationType: AuthorizationType.HEADER_BASED_AUTHORIZATION,
                authorizationHeader: "Bearer " + JwtToken.setupToken(),
            };
        }
        const headerDto: HeaderDto = {
            url: this.baseUrl + "/api/" + endPoint,
            timeout: 3000,
            authorizationType: AuthorizationType.HEADER_BASED_AUTHORIZATION,
            authorizationHeader: "Bearer " + JwtToken.setupToken(),
        };

        return headerDto;
    }

    setupData(rawBody: string): any {
        return {
            rawBody: rawBody,
            mimeType: "application/json",
        };
    }

    makeAxiosConfiguration(config: {
        timeout: number;
        authorizationHeader: string;
    }): AxiosRequestConfig {
        const axiosConfig: AxiosRequestConfig = {
            timeout: config.timeout,
            headers: { "Content-Type": "application/json" },
        };

        axiosConfig.headers["Authorization"] = config.authorizationHeader;

        return axiosConfig;
    }

    async post<T>(endpoint: string, data: T): Promise<T> {
        const header = this.setupHeader(endpoint);
        const axiosConfig = this.makeAxiosConfiguration(header);

        try {
            const result = await this.httpService
                .post(header.url, data, axiosConfig)
                .toPromise();

            Logger.warn(
                `post: ${data} to  ${endpoint} resulting in ${result.status.toString()} and message: ${
                    result.statusText
                }`
            );
            return JSON.parse(result.statusText.toString());
        } catch (err) {
            Logger.error(`post got error: ${err}`);
            // throw new BadRequestException(err);
            return err;
        }
    }

    async put<T>(endpoint: string, data: T, id: number): Promise<T> {
        const header = this.setupHeader(endpoint);
        const axiosConfig = this.makeAxiosConfiguration(header);
        const url = header.url + "/" + id;

        try {
            const result = await this.httpService
                .put(url, data, axiosConfig)
                .toPromise();

            Logger.warn(
                `put: ${data} to  ${endpoint} resulting in ${result.status.toString()} and message: ${
                    result.statusText
                }`
            );
            return result.data;
        } catch (err) {
            Logger.error(`Put got error: ${err}`);
            // throw new NotFoundException(ErrorCodes.IdDoesNotExists)
            return err;
        }
    }

    async getById<T>(endpoint: string, id: number): Promise<T> {
        const header = this.setupHeader(endpoint);
        const axiosConfig = this.makeAxiosConfiguration(header);
        try {
            const url = header.url + "/" + id;
            const result = await this.httpService
                .get(url, axiosConfig)
                .toPromise();

            Logger.warn(
                `get all from:${endpoint} resulting in ${result.status.toString()} and message: ${
                    result.statusText
                }`
            );
            return result.data;
        } catch (err) {
            Logger.error(`get got error: ${err}`);
            // throw new NotFoundException(ErrorCodes.IdDoesNotExists);
            return err;
        }
    }

    async delete<T>(endpoint: string, id: number): Promise<T> {
        const header = this.setupHeader(endpoint);
        const axiosConfig = this.makeAxiosConfiguration(header);
        try {
            const url = header.url + "/" + id;
            const result = await this.httpService
                .delete(url, axiosConfig)
                .toPromise();

            Logger.warn(
                `delete : ${result.status.toString()} and message: ${
                    result.statusText
                }`
            );
            return result.data;
        } catch (err) {
            Logger.error(`Delete got error: ${err}`);
            // throw new NotFoundException(ErrorCodes.IdDoesNotExists);
            return err;
        }
    }

    async getAll<T>(
        endpoint: string,
        limit?: number,
        offset?: number
    ): Promise<T> {
        const header = this.setupHeader(endpoint, limit, offset);
        const axiosConfig = this.makeAxiosConfiguration(header);

        try {
            const result = await this.httpService
                .get(header.url, axiosConfig)
                .toPromise();
            Logger.warn(
                `get all from:${endpoint} resulting in ${result.status.toString()} and message: ${
                    result.statusText
                }`
            );
            return result.data;
        } catch (err) {
            Logger.error(`get got error: ${err}`);
            return err;
        }
    }
}
