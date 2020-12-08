import React, { Component } from 'react';



class Dashboard extends Component {
    
    constructor(props){
        super(props);
        this.state = {
            user: JSON.parse(localStorage.getItem("user")),
        }
        
    }
    render() {
        return (
            <div>
                <p>Dashboard: Hello {this.state.user.name}</p>
            </div>
        )
    }
}

export default Dashboard