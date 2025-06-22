import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getUserFriends } from "../lib/api";
import FriendCard from "../components/FriendCard";
import NoFriendsFound from "../components/NoFriendsFound";
import PageLoader from "../components/PageLoader";

const FriendsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: friends, isLoading } = useQuery({
    queryKey: ["friends"],
    queryFn: getUserFriends,
  });

  if (isLoading) return <PageLoader />;

  const filteredFriends = friends?.filter((friend) =>
    friend.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Friends</h1>
          <p className="text-base-content/70">Connect and chat with your language partners</p>
        </div>

        <div className="w-full md:w-auto">
          <input
            type="text"
            placeholder="Search friends..."
            className="input input-bordered w-full md:w-64"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {filteredFriends?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFriends.map((friend) => (
            <FriendCard key={friend._id} friend={friend} />
          ))}
        </div>
      ) : (
        <NoFriendsFound />
      )}
    </div>
  );
};

export default FriendsPage; 