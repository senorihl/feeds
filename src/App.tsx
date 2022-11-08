import React from "react";
import {Helmet, HelmetProvider} from "react-helmet-async";
import {
  HashRouter,
  Route,
  Routes,
  Link,
  NavLink,
  NavLinkProps,
} from "react-router-dom";
import logoSrc from "./logo.svg";

import { Home } from "./pages/Home";
import {Subscriptions} from "./pages/Subscriptions";

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

const App: React.FC = () => {
  const helmetContext = {
    titleTemplate: "%s | MyAwesomeWebsite.com"
  };
  return (
    <HelmetProvider>
      <Helmet titleTemplate={"%s | Feeds"}></Helmet>
      <HashRouter>
          <nav className="navbar navbar-expand-lg bg-light">
            <div className="container-fluid">

            <Link
              to={"/"}
              className="navbar-brand"
            >
              <img src={logoSrc} height={40} />
            </Link>
            <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav"
                    aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
              <span className="navbar-toggler-icon"></span>
            </button>

            <div className="collapse navbar-collapse" id="navbarNav">
              <ul className="navbar-nav">
                <li className="nav-item">
                  <BootstrapNavLink to={"/subscriptions"} className="nav-link">Subscriptions</BootstrapNavLink>
                </li>
              </ul>
            </div>
            </div>
          </nav>
        <div className="container-fluid mt-3">
          <Routes>
            <Route path="/" element={<Home />}></Route>
            <Route path="/subscriptions" element={<Subscriptions />}></Route>
          </Routes>
        </div>
      </HashRouter>
    </HelmetProvider>
  );
};

export default App;
