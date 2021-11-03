import React, { Component } from 'react';
import { Table } from 'reactstrap';

export class Users extends Component {
    static displayName = Users.name;

    render() {        
        let items = [];

        const symptoms_map = new Map()
        symptoms_map.set("0", "None")
        symptoms_map.set("1", "Headache")
        symptoms_map.set("2", "Dizziness")
        symptoms_map.set("3", "Nausea")
        symptoms_map.set("4", "Fatigue")
        symptoms_map.set("5", "Sadness")

        const severity_map = new Map()
        severity_map.set("0", "None")
        severity_map.set("1", "mild")
        severity_map.set("2", "mild")
        severity_map.set("3", "moderate")
        severity_map.set("4", "severe")

        if(this.props.usersList.length > 0) {
            for (const [index, value] of this.props.usersList.entries()) {

                let symp_str = ""
                let i = 0;
                for (const symptom of value.symptom) {
                    let severe = severity_map.get(value.severity[i++]);
                    if (severe === "None")
                        symp_str += i + ". doesn't have " + symptoms_map.get(symptom) + ",";
                    else
                        symp_str += i + ". Has " + severe + " " + symptoms_map.get(symptom) + ",";
                }

                let lines = symp_str.split(',')
                let linesHTML = lines.map((line) => <div>{line}</div>);
                items.push(<tr id={value.name}>
                        <td headers="rowNum">{index + 1}</td>
                        <td headers="phone">{value._id}</td>
                        <td headers="date">{value.date}</td>
                        <td headers="symptoms">{linesHTML}</td>
                        <td headers="action">
                            <button value={value._id} onClick={(event) => this.props.onDeleteClick(event, value._id)}>
                                Delete
                            </button>
                        </td>
                    </tr>
                )
            }
       }

        return (
            <div>
                <h1>Users</h1><br/>
                <br/>
                <Table>
                    <thead>
                        <tr>
                        <th>#</th>
                        <th>Number</th>
                        <th>Date</th>
                        <th>Symptoms</th>
                        <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                       {items}
                    </tbody>
                </Table>
            </div>
        );
    }
}