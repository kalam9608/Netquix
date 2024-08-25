import React, { useEffect, useState } from "react";
import Slider from "./sliderSection";
import Header from "../common/header";
import AboutApp from "./aboutApp";
import AboutChitChat from "./aboutChitChat";
import TeamWork from "./teamWork";
import Collaboration from "./collaboration";
import TeamExpert from "./teamExpert";
import SecureApp from "./secureApp";
import PricePlan from "./pricePlan";
import Subscribe from "./subscribe";
import Footer from "../common/footer";
import TapTop from "../common/tapTop";
import { useAppDispatch, useAppSelector } from "../../app/store";
import {
  getMasterDataAsync,
  masterState,
} from "../../app/components/master/master.slice";
import LandingHeader from "./landingHeader";
import { Container } from "reactstrap";
import Category from "./category";
import { divide } from "lodash";
import Course from "./course";
import FooterLanding from "./footerLanding";
import { WhyChooseUs } from "../../app/components/landing/whyChooseUs";
import { HowItWorks } from "../../app/components/landing/howItWorks";
import YourCourses from "./yourCourses";

const Landing = () => {
  const masterRecords = useAppSelector(masterState).master;
  const dispatch = useAppDispatch();
  const [data, setData] = useState();

  useEffect(() => {
    dispatch(getMasterDataAsync());
  }, []);

  useEffect(() => {
    setData(masterRecords.masterData);
  }, [masterRecords]);

  return (
    // <div>
    //   <Header />
    //   <Slider />
    //   <AboutApp />
    //   <AboutChitChat />
    //   <TeamWork />
    //   <SecureApp />
    //   <Collaboration />
    //   <TeamExpert />
    //   <PricePlan />
    //   <Subscribe />
    //   <Footer />
    //   <TapTop />
    //       </div>

    <React.Fragment>
      <LandingHeader masterRecords={data} />
      <div className="dropdown-divider"></div>
      {/* <div className="container-fluid"> */}
      <Category masterRecords={data} />
      <Course masterRecords={data} />
      <YourCourses />
      <HowItWorks />
      <WhyChooseUs />
      <FooterLanding masterRecords={data} />
      {/* </div> */}
    </React.Fragment>
  );
};

export default Landing;
