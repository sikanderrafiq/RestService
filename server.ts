import express = require("express");
import fs = require('fs')
import path = require('path')
import bodyParser from 'body-parser';
import errorMiddleware from "../middleware/error.middleware";

class Server {
    port: number = parseInt(process.env.PORT || "8887", 10);
    host: any = process.env.HOST || '';

    // Create a new express application instance
    public app: express.Application = express();

    constructor(controllers: any[]) {
        this.initializeMiddlewares();
        this.initializeControllers(controllers);
        //WARNING: Error handling middle layer should be last in the application stack to work properly
        this.initializeErrorHandling();
    }

    private initializeMiddlewares() {
        this.app.use(bodyParser.json());

        // CORS & Preflight request
        this.app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
            if (req.path !== '/') {
                res.set({
                    'Access-Control-Allow-Credentials': true,
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization,pragma,cache-control,expires',
                    'Access-Control-Allow-Methods': 'PUT,POST,GET,DELETE,OPTIONS',
                    'Content-Type': 'application/json; charset=utf-8'
                });
            }
            req.method === 'OPTIONS' ? res.status(204).end() : next()
        });

        this.app.get('/', function (req, resp) {
            resp.json({
                title: "microservice-fileopes",
                description: "Service for nexus data reading and generating dat files.",
                uptime: process.uptime(),
                started: new Date(),
                memoryUsage: process.memoryUsage()
            });
        });
    }

    private initializeErrorHandling() {
        this.app.use(errorMiddleware);
    }

    private initializeControllers(controllers: any[]) {
        controllers.forEach((controller: any) => {
            this.app.use('/', controller.router);
        });
    }

    public listen() {
        this.app.listen(this.port, this.host, () => {
            console.log(`server running @ http://${this.host ? this.host : 'localhost'}:${this.port}`)
        })
    }
}

export default Server;