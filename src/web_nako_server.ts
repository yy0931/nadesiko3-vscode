import * as vscode from 'vscode'
import * as http from "http"
import * as getPort from "get-port"
import * as open from "open"
import * as express from "express"
import * as path from "path"
import * as ws from "ws"
import * as url from "url"

export type Data = { fileName: string, code: string }

export default class WebNakoServer {
    private host = "127.0.0.1"
    private serverInfo: { port: number, server: http.Server, wsServer: ws.Server } | null = null
    private data: Data | null = null

    async startServer() {
        const app = express()
        app.use("/node_modules", express.static(path.join(__dirname, "../node_modules")))
        app.use("/static", express.static(path.join(__dirname, "../static")))
        app.get("/", (req, res) => { res.sendFile(path.join(__dirname, "../static/index.html")) })
        const port = await getPort({ host: this.host })
        const server = http.createServer(app)
        const wsServer = new ws.Server({ server })
        wsServer.on("connection", (socket) => {
            socket.send(JSON.stringify(this.data))
        })
        server.on("error", (err) => { vscode.window.showErrorMessage(err + "") })

        return new Promise<void>((resolve) => {
            server.listen(port, this.host, () => {
                this.serverInfo = { port, server, wsServer }
                resolve()
            })
        })
    }

    async runCode(fileName: string, code: string) {
        // コネクション確立時にデータを送るために、先にcodeをセットしておく
        this.data = { fileName, code }

        // サーバーが起動していなければ起動する
        if (this.serverInfo === null) {
            await this.startServer()
            open(`http://${this.host}:${this.serverInfo!.port}/`)
        } else {
            // 接続されているクライアントが存在すればデータを送信する。存在しなければページを開く。
            if (this.serverInfo!.wsServer.clients.size > 0) {
                this.serverInfo!.wsServer.clients.forEach((socket) => { socket.send(JSON.stringify(this.data)) })
            } else {
                open(`http://${this.host}:${this.serverInfo!.port}/`)
            }
        }
    }

    dispose() {
        if (this.serverInfo === null) {
            return
        }
        this.serverInfo.server.close()
        this.serverInfo = null
    }
}