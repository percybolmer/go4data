/**
 * @fileoverview gRPC-Web generated client stub for users
 * @enhanceable
 * @public
 */

// GENERATED CODE -- DO NOT EDIT!


/* eslint-disable */
// @ts-nocheck



const grpc = {};
grpc.web = require('grpc-web');


var google_protobuf_timestamp_pb = require('google-protobuf/google/protobuf/timestamp_pb.js')
const proto = {};
proto.users = require('./user_pb.js');

/**
 * @param {string} hostname
 * @param {?Object} credentials
 * @param {?Object} options
 * @constructor
 * @struct
 * @final
 */
proto.users.UserClient =
    function(hostname, credentials, options) {
  if (!options) options = {};
  options['format'] = 'text';

  /**
   * @private @const {!grpc.web.GrpcWebClientBase} The client
   */
  this.client_ = new grpc.web.GrpcWebClientBase(options);

  /**
   * @private @const {string} The hostname
   */
  this.hostname_ = hostname;

};


/**
 * @param {string} hostname
 * @param {?Object} credentials
 * @param {?Object} options
 * @constructor
 * @struct
 * @final
 */
proto.users.UserPromiseClient =
    function(hostname, credentials, options) {
  if (!options) options = {};
  options['format'] = 'text';

  /**
   * @private @const {!grpc.web.GrpcWebClientBase} The client
   */
  this.client_ = new grpc.web.GrpcWebClientBase(options);

  /**
   * @private @const {string} The hostname
   */
  this.hostname_ = hostname;

};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.users.UserRequest,
 *   !proto.users.UserResponse>}
 */
const methodDescriptor_User_GetUser = new grpc.web.MethodDescriptor(
  '/users.User/GetUser',
  grpc.web.MethodType.UNARY,
  proto.users.UserRequest,
  proto.users.UserResponse,
  /**
   * @param {!proto.users.UserRequest} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.users.UserResponse.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.users.UserRequest,
 *   !proto.users.UserResponse>}
 */
const methodInfo_User_GetUser = new grpc.web.AbstractClientBase.MethodInfo(
  proto.users.UserResponse,
  /**
   * @param {!proto.users.UserRequest} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.users.UserResponse.deserializeBinary
);


/**
 * @param {!proto.users.UserRequest} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.users.UserResponse)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.users.UserResponse>|undefined}
 *     The XHR Node Readable Stream
 */
proto.users.UserClient.prototype.getUser =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/users.User/GetUser',
      request,
      metadata || {},
      methodDescriptor_User_GetUser,
      callback);
};


/**
 * @param {!proto.users.UserRequest} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.users.UserResponse>}
 *     A native promise that resolves to the response
 */
proto.users.UserPromiseClient.prototype.getUser =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/users.User/GetUser',
      request,
      metadata || {},
      methodDescriptor_User_GetUser);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.users.BaseRequest,
 *   !proto.users.UserResponse>}
 */
const methodDescriptor_User_Login = new grpc.web.MethodDescriptor(
  '/users.User/Login',
  grpc.web.MethodType.UNARY,
  proto.users.BaseRequest,
  proto.users.UserResponse,
  /**
   * @param {!proto.users.BaseRequest} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.users.UserResponse.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.users.BaseRequest,
 *   !proto.users.UserResponse>}
 */
const methodInfo_User_Login = new grpc.web.AbstractClientBase.MethodInfo(
  proto.users.UserResponse,
  /**
   * @param {!proto.users.BaseRequest} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.users.UserResponse.deserializeBinary
);


/**
 * @param {!proto.users.BaseRequest} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.users.UserResponse)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.users.UserResponse>|undefined}
 *     The XHR Node Readable Stream
 */
proto.users.UserClient.prototype.login =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/users.User/Login',
      request,
      metadata || {},
      methodDescriptor_User_Login,
      callback);
};


/**
 * @param {!proto.users.BaseRequest} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.users.UserResponse>}
 *     A native promise that resolves to the response
 */
proto.users.UserPromiseClient.prototype.login =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/users.User/Login',
      request,
      metadata || {},
      methodDescriptor_User_Login);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.users.BaseRequest,
 *   !proto.users.UserResponse>}
 */
const methodDescriptor_User_CreateUser = new grpc.web.MethodDescriptor(
  '/users.User/CreateUser',
  grpc.web.MethodType.UNARY,
  proto.users.BaseRequest,
  proto.users.UserResponse,
  /**
   * @param {!proto.users.BaseRequest} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.users.UserResponse.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.users.BaseRequest,
 *   !proto.users.UserResponse>}
 */
const methodInfo_User_CreateUser = new grpc.web.AbstractClientBase.MethodInfo(
  proto.users.UserResponse,
  /**
   * @param {!proto.users.BaseRequest} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.users.UserResponse.deserializeBinary
);


/**
 * @param {!proto.users.BaseRequest} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.users.UserResponse)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.users.UserResponse>|undefined}
 *     The XHR Node Readable Stream
 */
proto.users.UserClient.prototype.createUser =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/users.User/CreateUser',
      request,
      metadata || {},
      methodDescriptor_User_CreateUser,
      callback);
};


/**
 * @param {!proto.users.BaseRequest} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.users.UserResponse>}
 *     A native promise that resolves to the response
 */
proto.users.UserPromiseClient.prototype.createUser =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/users.User/CreateUser',
      request,
      metadata || {},
      methodDescriptor_User_CreateUser);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.users.UserRequest,
 *   !proto.users.AckResponse>}
 */
const methodDescriptor_User_DeleteUser = new grpc.web.MethodDescriptor(
  '/users.User/DeleteUser',
  grpc.web.MethodType.UNARY,
  proto.users.UserRequest,
  proto.users.AckResponse,
  /**
   * @param {!proto.users.UserRequest} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.users.AckResponse.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.users.UserRequest,
 *   !proto.users.AckResponse>}
 */
const methodInfo_User_DeleteUser = new grpc.web.AbstractClientBase.MethodInfo(
  proto.users.AckResponse,
  /**
   * @param {!proto.users.UserRequest} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.users.AckResponse.deserializeBinary
);


/**
 * @param {!proto.users.UserRequest} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.users.AckResponse)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.users.AckResponse>|undefined}
 *     The XHR Node Readable Stream
 */
proto.users.UserClient.prototype.deleteUser =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/users.User/DeleteUser',
      request,
      metadata || {},
      methodDescriptor_User_DeleteUser,
      callback);
};


/**
 * @param {!proto.users.UserRequest} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.users.AckResponse>}
 *     A native promise that resolves to the response
 */
proto.users.UserPromiseClient.prototype.deleteUser =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/users.User/DeleteUser',
      request,
      metadata || {},
      methodDescriptor_User_DeleteUser);
};


module.exports = proto.users;

