import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useClubStore } from "@/stores/clubStore";

const SidebarComponent = () => {
  const { clubs, openClubs, selectedTeam, toggleClub, selectTeam } =
    useClubStore();

  return (
    <div className="w-[250px] bg-muted/40 border-r min-h-screen flex flex-col">
      <div className="px-4 py-4 border-b border-border/60 flex items-center min-h-[45px]">
        <Link
          to="/"
          className="text-lg font-semibold text-foreground hover:text-primary transition-colors cursor-pointer"
        >
          CHINBA
        </Link>
      </div>
      <div className="p-2 flex-1">
        <div>
          {clubs.map((club) => (
            <div key={club.name} className="mb-2">
              <button
                onClick={() => toggleClub(club.name)}
                className="w-full p-2 text-left hover:bg-accent/50 rounded flex items-center gap-2"
              >
                <ChevronRight
                  className={`h-4 w-4 transition-transform ${
                    openClubs.includes(club.name) ? "rotate-90" : ""
                  }`}
                />
                <span>{club.name}</span>
              </button>
              {openClubs.includes(club.name) && (
                <div className="ml-6 mt-1">
                  {club.teams.map((team) => {
                    const isSelected =
                      selectedTeam?.club === club.name &&
                      selectedTeam?.team === team;
                    return (
                      <button
                        key={team}
                        onClick={() => selectTeam(club.name, team)}
                        className={`w-full p-2 text-left text-sm rounded transition-colors ${
                          isSelected
                            ? "bg-primary/10 text-primary font-medium"
                            : "hover:bg-accent/50"
                        }`}
                      >
                        {team}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SidebarComponent;
