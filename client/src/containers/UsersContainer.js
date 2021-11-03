import React, { Component } from 'react';
import { Users } from '../components/Users';

export class UsersContainer extends Component {
    static displayName = UsersContainer.name;

    constructor(props) {
        super(props);

        this.state = {
            usersList: [],
            token: this.props.cookies.get('token')
        };

        this.handleDeleteClick = this.handleDeleteClick.bind(this);
        this.populateUsersTable = this.populateUsersTable.bind(this);
    }

    async componentDidMount(){
        await this.populateUsersTable();
    }

    async populateUsersTable(){

        let response = await fetch('/users', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'x-jwt-token': this.state.token,
            },
        });

        let data = await response.json()

        if(data.hasOwnProperty("error")){
            alert(data.message);
            return;
        }

        console.log(data);

        this.setState({
            usersList: data
        })

    }

    async handleDeleteClick(event, id) {
        event.preventDefault();

        let response = await fetch('/delete/user', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'x-jwt-token': this.state.token,
            },
            body: JSON.stringify({
                _id: id,
            })
        });

        let data = await response.json()

        if(data.hasOwnProperty("error")){
            alert(data.message);
            return;
        }

       await this.populateUsersTable();
      
    }

  
    render() {
        console.log(this.state)
        return (
            <div>
                <Users
                    usersList={this.state.usersList}
                    onDeleteClick={this.handleDeleteClick}
                />
            </div>
        );
    }
}
