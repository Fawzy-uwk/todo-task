import { ClockLoader } from "react-spinners";

function Loader() {
  return (
    <div className="flex justify-center items-center mt-6">
      <ClockLoader size={50} color="#3f51b5" />
    </div>
  );
}

export default Loader;
