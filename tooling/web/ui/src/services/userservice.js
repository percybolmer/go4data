
import { UserRequest, BaseRequest } from "../proto/user_pb";
import { UserClient } from "../proto/user_grpc_web_pb";


var client = new UserClient("http://localhost:8080");


// GetUser is used to fetch a User from the API
// The callback function can be used to assign the returned value upon response
export function GetUser(callback) {
    
    var user = JSON.parse(localStorage.getItem('user'));
    var userRequest = new UserRequest();
    if (user !== null) {
        userRequest.setId(user.id);
        client.getUser(userRequest, {}, callback);
    }
    
    
}
// SignupUser expects a user as first parameter
// User is a struct with username, email and password  set. 
// The callback is used to trigger an action upon response
// the callback should be of function (err,response)
export function SignupUser(user, callback) {
    var request = new BaseRequest();
    if (!user) {
        callback({message: "Cannot use a empty user in signup"});
    }
    request.setName(user.name);
    request.setEmail(user.email);
    request.setPassword(user.password);
    client.createUser(request, {}, callback);
}
// LoginUser expects a user as first parameter
// User should contain name and password set.
// The second parameter is an callback to run when the API request is complete
export function LoginUser(user, callback) {
    var request = new BaseRequest();
    if (!user) {
        callback({message: "Cannot use a emtpy user in login"});
    }
    request.setName(user.name);
    request.setPassword(user.password);
    client.login(request, {}, callback);
}

