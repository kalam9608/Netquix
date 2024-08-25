import React, { useState, useRef } from "react";
import { Modal } from "reactstrap";
import Cropper from "react-easy-crop";
import { MdOutlineRotate90DegreesCcw } from "react-icons/md";
import getCroppedImg from "./cropImage";

const CropImage = ({
  image,
  isModalOpen,
  setIsModalOpen,
  setCroppedImage,
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [cropSize, setCropSize] = useState({ width: 200, height: 200 });
  const [rotation, setRotation] = useState(0);
  const cropperRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const showCroppedImage = async () => {
    try {
      const croppedImage = await getCroppedImg(
        URL.createObjectURL(image),
        croppedAreaPixels,
        rotation
      );
      setCroppedImage(croppedImage);
      setIsModalOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  const onClose = () => {
    setIsModalOpen(false);
    setCroppedImage(null);
  };

  const handleRotation = () => {
    setRotation((rotation + 90) % 360);
  };
  return (
    <Modal isOpen={isModalOpen} centered>
      {image && (
        <div>
          <Cropper
            style={{
              containerStyle : {
                position : 'relative',
                top : '0',
                left: '0',
                right : '0',
                bottom : '0',
                height : '500px',
              },
            }}
            image={URL.createObjectURL(image)}
            crop={crop}
            cropSize={cropSize}
            rotation={rotation}
            zoom={zoom}
            aspect={4 / 3}
            onCropChange={setCrop}
            onRotationChange={setRotation}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
          />
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px",
          marginTop: "10px",
        }}
      >
        <button
          type="button"
          onClick={onClose}
          style={{
            border: "1px solid red",
            color: "#fff",
            backgroundColor: "red",
            borderRadius: "8px",
            padding: "8px 15px",
            fontSize: "12px",
            outline: "none",
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleRotation}
          style={{
            backgroundColor: "transparent",
            border: "none",
            outline: "none",
            color: "#000",
            fontSize: "25px",
          }}
        >
          <MdOutlineRotate90DegreesCcw />
        </button>
        <button
          type="button"
          onClick={showCroppedImage}
          style={{
            border: "1px solid green",
            color: "#fff",
            backgroundColor: "green",
            borderRadius: "8px",
            padding: "8px 15px",
            fontSize: "12px",
            outline: "none",
          }}
        >
          Done
        </button>
      </div>
    </Modal>
  );
};

export default CropImage;
