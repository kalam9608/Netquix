import React, { useEffect, useState } from "react";
import { Courses, CourseItems } from "../../app/common/constants";
import { ChevronRight, Filter, Circle } from "react-feather";
import { LABELS } from "../../utils/constant";

const Course = (masterRecords) => {
  const [tabletView, setTableView] = useState(false);

  useEffect(() => {
    const updateTableView = () => {
      const isTablet = window.innerWidth === 1180 && window.innerHeight === 820;
      setTableView(isTablet);
    };

    // Initial update
    updateTableView();

    // Listen to window resize events
    window.addEventListener("resize", updateTableView);

    // Clean up the event listener when the component unmounts
    return () => {
      window.removeEventListener("resize", updateTableView);
    };
  }, []);

  return (
    <React.Fragment>
      {/* <nav className="navbar navbar-light">
        <a
          className="navbar-brand font-weight-bold text-uppercase ml-4"
          href="#"
        >
          New Courses
        </a>
        <div className="d-flex">
          {CourseItems.map((item, index) => {
            const { name } = item;
            return (
              <span
                key={index}
                className="badge badge-light lg mr-4"
                style={{
                  padding: "18px",
                  alignItems: "center",
                  fontSize: "14px",
                  color: "black",
                }}
              >
                {name}
              </span>
            );
          })}
        </div>
      </nav> */}

      {/* <div className="container">
        <div className={`row gy-3`}>
          {CourseData.map((data, index) => {
            const { img, name, courseDetails } = data;
            return (
              <div
                key={name}
                className={`col-12 col-md-6 ${
                  tabletView ? "col-lg-4" : "col-lg-3"
                }`}
              >
                <div className="card mb-4" style={{ borderRadius: "15px" }}>
                  <img
                    className="card-img-top"
                    src={img}
                    alt="Card image cap"
                    style={{ padding: "10px", borderRadius: "20px" }}
                  />
                  <div className="card-body">
                    <h5 className="card-title text-truncate">{name}</h5>

                    <div className="row mt-4 mb-4">
                      {courseDetails.map((data) => (
                        <div className={`${tabletView ? "col-6" : "col-6"}`}>
                          <i className={`${data.icon} mr-2`}></i>
                          <span>
                            {data.name}{" "}
                            {data && data.enroll ? `: ${data.enroll}` : null}
                          </span>
                        </div>
                      ))}
                    </div>
                    <button
                      className="btn btn-dark btn-sm"
                      style={{
                        height: tabletView ? null : "5vh",
                        width: tabletView ? null : "9vw",
                      }}
                    >
                      Start Course
                      <ChevronRight
                        style={{
                          position: "absolute",
                          left: tabletView ? "auto" : "61%",
                          top: tabletView ? "85.7%" : "84.5%",
                        }}
                      />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div> */}

      {/* <div className="container">
        <div className="row gy-3">
          {Courses.map((data, index) => {
            const { name, img, courseDetails } = data;
            return (
              <div
                key={`course_card${index}`}
                className={"col-md-6 col-sm-2 col-lg-3"}
              >
                <div className="card mb-4" style={{ borderRadius: "15px" }}>
                  <img
                    className="card-img-top"
                    src={img}
                    alt="Card image cap"
                    style={{ padding: "10px", borderRadius: "20px" }}
                  />
                  <div className="card-body">
                    <h5 className="card-title text-truncate">{name}</h5>

                    <div className="row mt-4 mb-4">
                      {courseDetails.map((data) => (
                        <div className={`${tabletView ? "col-6" : "col-6"}`}>
                          <i className={`${data.icon} mr-2`}></i>
                          <span>
                            {data.name}{" "}
                            {data && data.enroll ? `: ${data.enroll}` : null}
                          </span>
                        </div>
                      ))}
                    </div>
                    <button className="btn btn-dark btn-sm d-flex">
                      <div>Start Course</div>
                      <div className="pl-2">
                        <ChevronRight />
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div> */}
      <div className="container">
        <div className="col-11 ml-2">
          <div className="dot-btn dot-success mt-4" >
          </div>
            <h3 className="ml-1  text-uppercase mb-1 "> {LABELS.PROMO_ONE} </h3>
        </div>

        <div className={`row gy-3`}>
          {Courses.map((data, index) => {
            const { img, name, courseDetails } = data;
            return (
              <div key={`courses_list${index}`} className="col-lg-4 col-sm-12">
                <div className="card m-2">
                  <img
                    className="card-img-top"
                    src={img}
                    alt="Card image cap"
                    style={{ padding: "10px", borderRadius: "20px" }}
                  />
                  <div className="card-body">
                    <h5 className="card-title text-truncate">{name}</h5>
                    <div className="row mt-4 mb-4">
                      {/* {courseDetails?.map((data, index) => {
                          const category =
                            masterRecords?.masterRecords?.category[index];

                          return (
                            <div
                              className={`${tabletView ? "col-6" : "col-6"}`}
                              key={index}
                            >
                              <i className={`${data.icon} mr-2`}></i>
                              {data.name}{" "}
                              <span style={{ display: "flex" }}>
                                {data && data.enroll
                                  ? `: ${data.enroll}`
                                  : `: ${category}`}
                              </span>
                            </div>
                          );
                        })} */}

                      {courseDetails?.map((data, index) => (
                        // <div className={`${tabletView ? "col-6" : "col-6"}`}>
                        <div
                          key={`courses-details${index}`}
                          className="col-lg-6 col-sm-12"
                        >
                          <i className={`${data.icon} mr-2`}></i>
                          {data.name}{" "}
                          <span>
                            {data && data.enroll ? `: ${data.enroll}` : null}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <button className="btn btn-primary btn-sm d-flex">
                        <div>Book session</div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </React.Fragment>
  );
};

export default Course;
