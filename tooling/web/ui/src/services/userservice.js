
import { UserRequest } from "../proto/user_pb";
import { UserClient } from "../proto/user_grpc_web_pb";


var client = new UserClient("http://localhost:8080");


// GetUser is used to fetch a User from the API
// The callback function can be used to assign the returned value upon response
export function GetUser(callback) {
    var user = JSON.parse(localStorage.getItem('user'));
    var userRequest = new UserRequest();
    if (user !== null) {
        userRequest.setId(user.id);
    }
    userRequest.setId(1);
    client.getUser(userRequest, {}, function (err, response) {
        callback(response.toObject());
    });
}

