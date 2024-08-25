import React, { useState, useEffect } from 'react'
import { Utils } from '../../../../utils/utils'
import { useAppDispatch, useAppSelector } from '../../../store';
import { authState, authAction, getMeAsync } from '../../auth/auth.slice';
import { Edit, Save, Star, X } from "react-feather";
import { AccountType, TRAINER_AMOUNT_USD } from '../../../common/constants';
import SocialMediaIcons from '../../../common/socialMediaIcons';
import { myClips } from '../../../../containers/rightSidebar/fileSection.api';
import { bookingsAction, bookingsState, uploadProfilePictureAsync } from '../../common/common.slice';
import { toast, ToastContainer } from 'react-toastify';
import { getTraineeWithSlotsAsync, traineeState, updateTraineeProfileAsync } from '../../trainee/trainee.slice';
import { useMediaQuery } from '../../../hook/useMediaQuery'; 
import CropImage from './crop-modal';


const UserInfoCard = () => {
    const { userInfo, accountType } = useAppSelector(authState);
    const [isEditing, setIsEditing] = useState(false);
    const [imgURL, setImgURL] = useState("")
    const [selectedImage, setSelectedImage] = useState(null);
    const [displayedImage, setDisplayedImage] = useState("/assets/images/avtar/user.png");
    const dispatch = useAppDispatch()
    const { profile_picture, profile_image_url } = useAppSelector(bookingsState);
    const width1200 = useMediaQuery(1200)
    const [profile, setProfile] = useState({
        username: "",
        address: "Alabma , USA",
        wallet_amount: 0,
        hourly_rate: 0,
        editStatus: false,
        profile_picture: undefined,
    });
    const { getTraineeSlots } = useAppSelector(traineeState);
    const [trainerRatings, setTrainerRatings] = useState([])
    const [isModalOpen , setIsModalOpen] = useState(false);
    const [croppedImage , setCroppedImage] = useState(null);
    useEffect(() => {
        getMeAsync()
    }, [])

    useEffect(() => {
        if (profile_picture) {
            setProfile({ ...profile, profile_picture: profile_picture });
        }
    }, [profile_picture]);

    useEffect(() => {
        setProfile({
            ...profile,
            ...userInfo
        })
        // setDisplayedImage(userInfo?.profile_picture)
        setDisplayedImage(Utils?.dynamicImageURL(userInfo?.profile_picture))
    }, [userInfo])

    const handleEditClick = () => {
        setIsEditing(true);
    };

    const handleSaveClick = (e) => {
        setIsEditing(false);
        dispatch(updateTraineeProfileAsync(profile))
    };

    const handleRateChange = (e) => {
        setProfile({
            ...profile,
            extraInfo: {
                ...profile?.extraInfo,
                hourly_rate: e.target.value
            }
        })
    };

    const showRatings = (ratings, extraClasses = "") => {
        const { ratingRatio, totalRating } = Utils.getRatings(ratings);
        return (
            <>
                <div className={extraClasses}>
                    <Star color="#FFC436" size={28} className="star-container star-svg" />
                    <p className="ml-1 mt-1 mr-1 font-weight-light">{ratingRatio || 0}</p>
                    <p className="mt-1">({totalRating || 0})</p>
                </div>
            </>
        );
    };
    const handlePictureChange = (e) => {
        const selectedFile = e.target.files[0];
        setIsModalOpen(true);
        setSelectedImage(selectedFile);
    };
    const handleRemovePreview = () => {
        setCroppedImage(null);
        setSelectedImage(null);
    };

    const handleSavePicture = async() => {
        // if (selectedImage) {
        //     handelSelectFile(selectedImage)
        //     const reader = new FileReader();
        //     reader.onloadend = () => {
        //         const base64Data = reader.result;
        //         // Update the UI or store the base64Data as needed
        //         console.log("Updated profile picture:", base64Data);

        //         // Save the selectedImage and update the displayedImage after clicking "Save Picture"
        //         setSelectedImage(null);
        //         setDisplayedImage(URL.createObjectURL(selectedImage));
        //     };
        //     reader.readAsDataURL(selectedImage);
        // }
        if (croppedImage) {
            console.log(croppedImage , 'croppedImage');
            const newFileObj = await Utils?.blobToFile(croppedImage , `${profile?.fullname}.png` , "image/png")
            console.log(newFileObj , 'file')
            await handelSelectFile(newFileObj)
            setCroppedImage(null);
            setDisplayedImage(croppedImage)
        }
    };

    const handelSelectFile = async (file) => {
        if (file) {
            console.log(file , 'handelSelectFile')
            if (file instanceof File) {
                const fileSizeLessthan2Mb = Utils.fileSizeLessthan2Mb(file);
                if (fileSizeLessthan2Mb) {
                    let res = await dispatch(uploadProfilePictureAsync({ files: file }));
                    console.log(res, "response")
                    setProfile({
                        ...profile,
                        profile_picture: res?.payload?.url
                    })
                    setImgURL(res?.payload?.url)
                } else {
                    toast.error('Image should be less than 2MB')
                }
            } else {
                console.error("Invalid file selected.");
            }
        }
    };

    useEffect(() => {
        if (imgURL) {
            dispatch(updateTraineeProfileAsync(profile))
        }
    }, [imgURL])

    useEffect(() => {
        const findByTrainerId = getTraineeSlots.find(
            (trainer) => trainer && trainer?._id === profile?._id
        );
        setTrainerRatings(findByTrainerId?.trainer_ratings)
    }, [getTraineeSlots])

    useEffect(() => {
        const searchTerm = profile && profile?.fullname;
        const filterParams = {
            date: new Date(),
            day: new Date().getDay(),
            time: new Date().getTime(),
        }
        if (searchTerm && filterParams) {
            const filterPayload = {
                time: filterParams.time,
                day: filterParams.day,
                search: searchTerm,
            };
            dispatch(getTraineeWithSlotsAsync(filterPayload));
        }
    }, [profile]);

    return (
        <>
        <ToastContainer/>
        <div className={`Trainer-box-1 card-body`} style={{height : "100%"}}>
            {croppedImage ? (
                <div className="preview-image">
                    <img
                        src={croppedImage}
                        alt="Selected"
                        className="selected-image"
                        style={{ maxWidth: "200px", minWidth: "200px", minHeight: "200px", maxHeight: "200px"}}
                    />
                    <button className="icon-btn btn-sm btn-outline-light close-apps pointer position-absolute" style={{ right: "0px" }} onClick={handleRemovePreview}>
                        <X />
                    </button>
                </div>
            ) : (
                <img
                    src={displayedImage || '/assets/images/demoUser.png'}
                    alt="trainer_image"
                    className="rounded"
                    style={{ maxWidth: "200px", minWidth: "200px", minHeight: "200px", maxHeight: "200px" , border:"2px solid #000080" }}
                    onError={(e) => {
                        e.target.src = '/assets/images/demoUser.png';
                      }}
                />
            )}
            <div className="">
                {accountType === AccountType?.TRAINER && <div div className="Hourly-up">
                    <h3 className="Hourly-rate">
                        Hourly Rate: ${isEditing ? (
                            <input className="Rate-input-box"
                                type="number"
                                value={profile?.extraInfo?.hourly_rate}
                                onChange={handleRateChange}
                                onBlur={handleSaveClick}
                            />
                        ) : (
                            profile?.extraInfo?.hourly_rate
                        )}
                    </h3>
                    <a
                        className="icon-btn btn-outline-light btn-sm edit-btn Trainer"
                        href="#"
                        onClick={isEditing ? handleSaveClick : handleEditClick}
                    >
                        {isEditing ? <Save /> : <Edit />}
                    </a>
                </div>}


                {accountType === AccountType?.TRAINER && showRatings(trainerRatings, "d-flex")}
                {userInfo &&
                    userInfo.extraInfo &&
                    userInfo.extraInfo.social_media_links &&
                    userInfo.extraInfo.social_media_links ? (
                    <SocialMediaIcons
                        profileImageURL={""}
                        social_media_links={userInfo.extraInfo.social_media_links}
                        isvisible={false}
                    />
                ) : null}
                <div className="Change-up-button">
                    {!croppedImage && (
                        <>
                            <label htmlFor="profilePictureInput" className="btn btn-primary btn-sm">
                                Change Picture
                            </label>
                            <input
                                id="profilePictureInput"
                                type="file"
                                accept="image/*"
                                style={{ display: "none" }}
                                onChange={handlePictureChange}
                            />
                        </>
                    )}
                    {croppedImage && (
                        <button type="button" className="btn btn-success btn-sm" onClick={handleSavePicture}>
                            Save Picture
                        </button>
                    )}
                </div>
                {/* <div className="col-7 col-sm-6 col-md-7 col-lg-8 col-xl-9 card-trainer">
                    {accountType === AccountType?.TRAINER && <div div className="Hourly-up">
                        <h3 className="Hourly-rate">
                            Hourly Rate: ${isEditing ? (
                                <input className="Rate-input-box"
                                    type="number"
                                    value={profile?.extraInfo?.hourly_rate}
                                    onChange={handleRateChange}
                                    onBlur={handleSaveClick}
                                />
                            ) : (
                                profile?.extraInfo?.hourly_rate
                            )}
                        </h3>
                        <a
                            className="icon-btn btn-outline-light btn-sm edit-btn Trainer"
                            href="#"
                            onClick={isEditing ? handleSaveClick : handleEditClick}
                        >
                            {isEditing ? <Save /> : <Edit />}
                        </a>
                    </div>}


                    {accountType === AccountType?.TRAINER && showRatings(profile && profile?.ratings, "mt-3 d-flex ml-n2")}
                    {userInfo &&
                        userInfo.extraInfo &&
                        userInfo.extraInfo.social_media_links &&
                        userInfo.extraInfo.social_media_links ? (
                        <SocialMediaIcons
                            profileImageURL={""}
                            social_media_links={userInfo.extraInfo.social_media_links}
                            isvisible={false}
                        />
                    ) : null}
                    <div className="Change-up-button">
                        {!selectedImage && (
                            <>
                                <label htmlFor="profilePictureInput" className="btn btn-primary btn-sm">
                                    Change Picture
                                </label>
                                <input
                                    id="profilePictureInput"
                                    type="file"
                                    accept="image/*"
                                    style={{ display: "none" }}
                                    onChange={handlePictureChange}
                                />
                            </>
                        )}
                        {selectedImage && (
                            <button type="button" className="btn btn-success btn-sm" onClick={handleSavePicture}>
                                Save Picture
                            </button>
                        )}
                    </div>
                </div> */}

            </div>
        </div>
        <CropImage
            image={selectedImage}
            isModalOpen = {isModalOpen}
            setIsModalOpen = {setIsModalOpen}
            croppedImage = {croppedImage}
            setCroppedImage={setCroppedImage}
        />
        </>

    )
}

export default UserInfoCard