import React, { useEffect, useState } from "react";
import SearchableDropdown from "../../app/components/trainee/helper/searchableDropdown";
import {
  getTraineeWithSlotsAsync,
  traineeState,
} from "../../app/components/trainee/trainee.slice";
import { useAppDispatch, useAppSelector } from "../../app/store";
import { masterState } from "../../app/components/master/master.slice";
import { debouncedConfigs, params } from "../../app/common/constants";
import Modal from "../../app/common/modal";
import TrainersDetails from "../../app/components/public";
import { bookingsAction } from "../../app/components/common/common.slice";
import { ChevronRight } from "react-feather";
import { debounce } from "lodash";
import { LABELS } from "../../utils/constant";

const Category = (masterRecords) => {
  const dispatch = useAppDispatch();
  const { handleSelectedTrainer } = bookingsAction;
  const [isMobileScreen, setIsMobileScreen] = useState(false);
  const [query, setQuery] = useState("");
  const { getTraineeSlots } = useAppSelector(traineeState);
  const [getParams, setParams] = useState(params);
  const [selectedTrainer, setSelectedTrainer] = useState({ id: null });
  const [trainerInfo, setTrainerInfo] = useState({
    userInfo: null,
    isOpen: null,
    selectCategory: null,
  });
  const { master } = useAppSelector(masterState);
  const [categoryList, setCategoryList] = useState([]);
  const [listOfTrainers, setListOfTrainers] = useState([]);

  useEffect(() => {
    if (getParams.search) {
      dispatch(getTraineeWithSlotsAsync(getParams));
    }
  }, [getParams]);

  useEffect(() => {
    const { masterData } = master;
    setCategoryList([]);
    if (masterData && masterData.category && masterData.category.length) {
      const payload = masterData.category.map((category) => {
        return { id: category, name: category, isCategory: true };
      });
      setCategoryList(payload);
    }
  }, [master]);

  useEffect(() => {
    setListOfTrainers(
      getTraineeSlots?.map((trainer) => {
        return {
          id: trainer._id,
          background_image: trainer?.profilePicture,
          isActive: true,
          category: trainer?.category,
          name: trainer?.fullname,
          isCategory: false,
          extraInfo: trainer.extraInfo,
        };
      })
    );
  }, [getTraineeSlots]);

  const handleClose = () => {
    setTrainerInfo((prev) => ({
      ...prev,
      isOpen: false,
      userInfo: null,
      selectCategory: null,
    }));
    setParams("");
    (params.search = ""), setParams(params);
  };

  const [containerStyles, setContainerStyles] = useState({
    backgroundColor: "#9d01ac",
    borderRadius: "50%",
    alignItems: "center",
  });

  useEffect(() => {
    const smallScreenStyles = {
      // backgroundImage: 'url(particular_ad_small.png)',
      innerHeight: "200px",
      backgroundColor: "black",
    };

    if (window.innerWidth === 820) {
      setContainerStyles((prevStyles) => ({
        ...prevStyles,
        ...smallScreenStyles,
      }));
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const isMobileScreen = window.innerWidth < 390;
      setIsMobileScreen(isMobileScreen);
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <React.Fragment>
      <div className="container category-content">
        <div className="row">
          <div className="col d-none d-sm-block">
            {masterRecords?.masterRecords?.category?.map((item, index) => {
              return (
                <span
                  key={`category_item${index}`}
                  className="badge badge-light lg"
                  style={{
                    margin: "12px",
                    padding: "18px",
                    alignItems: "center",
                    fontSize: "14px",
                    color: "black",
                  }}
                >
                  {item}
                </span>
              );
            })}
          </div>
        </div>

        {/* <div className="d-flex flex-wrap justify-content-center align-items-center ">
          {masterRecords?.masterRecords?.category?.map((item, index) => {
            return (
              <span
                key={`category_item${index}`}
                className="badge badge-light lg"
                style={{
                  margin: "20px",
                  padding: "18px",
                  alignItems: "center",
                  fontSize: "14px",
                  color: "black",
                }}
              >
                {item}
              </span>
            );
          })}
        </div> */}
        <div className="container">
          <div className="row mt-5">
            <div className="col-lg-6">
              <div
                className="mt-4"
                style={{
                  fontSize: "35px",
                  color: "black",
                  fontWeight: 600,
                  textAlign: "left",
                }}
              >
                {LABELS.LANDIGN_MSG}
              </div>
              <div className="col-lg-6">
                <button className="btn btn-primary d-flex mb-4 mt-5">
                  <div style={{margin:"auto"}}>Get Started</div>
                  <div className="pl-2" style={{position:"relative", top:"3px"}}>
                    <ChevronRight />
                  </div>
                </button>
              </div>
            </div>
            <div
              className="col-lg-6  bg-primary"
              style={{ borderRadius: "50%" }}
            >
              <img
                src="/assets/images/1-removebg 1.png"
                alt="logo"
                style={{
                  // maxWidth: "500px",
                  maxWidth: "100%",
                  height: "auto",
                }}
                className="img-fluid"
              />
            </div>
          </div>
        </div>
        <div
          className={`container ${isMobileScreen
            ? "d-flex justify-content-start"
            : "d-flex justify-content-center"
            } `}
        >
          <div className="row my-5">
            <div className={`col-12 col-sm-12 col-md-12 col-lg-12 col-xl-12`}>
              <SearchableDropdown
                placeholder="Search Trainers..."
                options={[...listOfTrainers, ...categoryList]}
                label="name"
                id="id"
                customClasses={{
                  searchBar: "search-bar-trainee",
                  searchButton: "search-button-trainee",
                  dropdown: "custom-dropdown-width-landing",
                }}
                onSearchClick={(query) => {
                  if (query) {
                    setTrainerInfo((prev) => ({
                      ...prev,
                      userInfo: null,
                      isOpen: true,
                      selectCategory: query,
                    }));
                  }
                  setQuery(query);
                }}
                searchValue={(value) => {
                  setParams({ search: value });
                }}
                selectedOption={(option) => {
                  if (option && option.isCategory) {
                    setTrainerInfo((prev) => ({
                      ...prev,
                      userInfo: option,
                      isOpen: true,
                      selectCategory: option.name,
                    }));
                  } else {
                    setTrainerInfo((prev) => ({
                      ...prev,
                      userInfo: option,
                      isOpen: true,
                      selectCategory: null,
                    }));
                  }
                }}
                handleChange={(value) => {
                  setParams({ search: value });
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={trainerInfo.isOpen}
        overflowHidden={true}
        minHeight={true}
        element={
          <TrainersDetails
            onClose={handleClose}
            selectedOption={trainerInfo}
            categoryList={categoryList}
            key={`trainersDetails`}
            searchQuery={query}
            trainerInfo={trainerInfo.userInfo}
            selectTrainer={(_id) => {
              if (_id) {
                dispatch(handleSelectedTrainer(_id));
                setSelectedTrainer({ ...selectedTrainer, id: _id });
              }
            }}
          />
        }
      />
    </React.Fragment>
  );
};

export default Category;
