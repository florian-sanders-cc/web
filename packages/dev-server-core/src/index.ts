// reexports of types from internal libraries
export { FSWatcher } from 'chokidar';
export { default as Koa, Context, Middleware } from 'koa';
export { Server } from 'net';
import WebSocket from 'ws';
export { WebSocket };

export { DevServer } from './server/DevServer';
export { Plugin, ServerStartParams, ResolveOptions } from './plugins/Plugin';
export { DevServerCoreConfig, MimeTypeMappings } from './server/DevServerCoreConfig';
export { WebSocketsManager, WebSocketData } from './web-sockets/WebSocketsManager';
export {
  getRequestBrowserPath,
  getRequestFilePath,
  getResponseBody,
  getHtmlPath,
  isInlineScriptRequest,
} from './utils';
export { Logger, ErrorWithLocation } from './logger/Logger';
export { PluginSyntaxError } from './logger/PluginSyntaxError';
export { PluginError } from './logger/PluginError';
