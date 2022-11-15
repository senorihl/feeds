import React from "react";
import {Link, NavLink, NavLinkProps, Outlet, OutletProps} from "react-router-dom";
import logoSrc from "./logo.svg";
import {useUser} from "./utils/firebase";

export const PageLayout: React.FC<OutletProps> = () => {
    const user = useUser();
    return (
        <>
            <nav className="navbar navbar-expand-lg bg-light">
              <div className="container-fluid">
              <Link
                to={"/"}
                className="navbar-brand"
              >
                <img src={logoSrc} height={40} alt={"feeds logo"} />
              </Link>
              <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav"
                      aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                <span className="navbar-toggler-icon"></span>
              </button>

              <div className="collapse navbar-collapse" id="navbarNav">
                <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                  <li className="nav-item">
                    <BootstrapNavLink to={"/subscriptions"} className="nav-link">Subscriptions</BootstrapNavLink>
                  </li>
                </ul>
                  {user ? (
                      <span className="navbar-text">
                        Logged in as {user.displayName || user.email}
                      </span>
                  ) : (
                      <ul className="navbar-nav">
                          <li className="nav-item">
                              <BootstrapNavLink to={"/log-in"} className="nav-link">Log in</BootstrapNavLink>
                          </li>
                      </ul>
                  )}
              </div>
              </div>
            </nav>
            <Outlet />
        </>
    )
}



const BootstrapNavLink: React.FC<NavLinkProps> = (props) => {
    return (
        <NavLink
            {...props}
            className={({ isActive }) =>
                `${props.className} ${isActive ? "active" : ""}`
            }
        >
            {props.children}
        </NavLink>
    );
};
