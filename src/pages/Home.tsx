import React from "react";
import { Helmet } from "react-helmet-async";

export const Home: React.FC = () => {
  return (
    <div className="container-fluid">
      <Helmet>
        <title>Welcome</title>
      </Helmet>
      <p>Home</p>
    </div>
  );
};
