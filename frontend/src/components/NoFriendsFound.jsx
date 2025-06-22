import { UsersIcon } from "lucide-react";
import { Link } from "react-router-dom";

const NoFriendsFound = () => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="bg-base-200 p-4 rounded-full mb-4">
        <UsersIcon className="size-12 text-base-content/60" />
      </div>
      <h3 className="text-xl font-semibold mb-2">No Friends Found</h3>
      <p className="text-base-content/70 mb-6 max-w-md">
        You haven't added any friends yet. Explore our community to find language partners!
      </p>
      <Link to="/" className="btn btn-primary">
        Find Language Partners
      </Link>
    </div>
  );
};

export default NoFriendsFound;
