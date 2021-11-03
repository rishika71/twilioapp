import React, { Component } from 'react';
import { Collapse, Container, Navbar, NavbarBrand, NavbarToggler, NavItem, NavLink } from 'reactstrap';
import { Link } from 'react-router-dom';
import './NavMenu.css';

export class NavMenu extends Component {
  static displayName = NavMenu.name;

  constructor (props) {
    super(props);

    this.toggleNavbar = this.toggleNavbar.bind(this);
    this.state = {
      collapsed: true
    };
  }

  toggleNavbar () {
    this.setState({
      collapsed: !this.state.collapsed
    });
  }

  render () {

      let log = (<NavItem>
          <NavLink tag={Link} className="text-dark" to="/login" >Login</NavLink>
      </NavItem>);

      if (this.props.cookies.get('token') !== undefined) {
          log = (<NavItem>
              <NavLink tag={Link} className="text-dark" to="/login" onClick={() => this.props.setUser(null, null)}>Logout</NavLink>
          </NavItem>);
      }

    return (
      <header>
        <Navbar className="navbar-expand-sm navbar-toggleable-sm ng-white border-bottom box-shadow mb-3" light>
          <Container>
            <NavbarBrand>Admin</NavbarBrand>
            <NavbarToggler onClick={this.toggleNavbar} className="mr-2" />
            <Collapse className="d-sm-inline-flex flex-sm-row-reverse" isOpen={!this.state.collapsed} navbar>
              <ul className="navbar-nav flex-grow">
                { log }
              </ul>
            </Collapse>
          </Container>
        </Navbar>
      </header>
    );
  }
}
