import  * as winston from 'winston';


export class Logger {
    private _logger: winston.Logger|undefined;
    private _stage: string;
    private _service: string;


    constructor(stage: string, service: string) {
        this._stage = stage;
        this._service = service;
    }

    get stage() { return this._stage }
    get service() { return this._service }
    get logger(): winston.Logger|undefined { return this._logger }
    set stage(stage: string) { this._stage = stage }
    set logger(logger: winston.Logger) { this._logger = logger }
    set service(service: string) { this._service = service }


    async initialize(): Promise<winston.Logger> {
        this.logger = winston.createLogger({
                level: 'info',
                format: winston.format.combine(
                    winston.format.timestamp({
                        format: 'YYYY-MM-DD HH:mm:ss'
                    }),
                    winston.format.errors({stack: true}),
                    winston.format.splat(),
                    winston.format.json()
                ),
                defaultMeta: {service: this.service},
                transports: new winston.transports.Console()
        })

        if (this.stage !== "prod") {
            this.logger.clear()
            this.logger.add(
                new winston.transports.Console({
                    level: 'debug',
                })
            );
        }

        return this.logger
    }

    async logOutput(message: string, level: string): Promise<void> {
        const logMsg = {
            level: level,
            message: message
        }
        if (this.logger) {
            this.logger.log(logMsg)
        } else {
            const logger = await this.initialize()
            logger.log(logMsg)
        }
    }

    async info(message: string): Promise<void> {
        await this.logOutput(message, "info")
    }
    async debug(message: string): Promise<void> {
        await this.logOutput(message, "debug")
    }
    async warn(message: string): Promise<void> {
        await this.logOutput(message, "warn")
    }
    async error(message: string): Promise<void> {
        await this.logOutput(message, "error")
    }






}