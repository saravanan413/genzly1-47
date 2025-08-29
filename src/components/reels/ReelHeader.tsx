
interface ReelHeaderProps {}

const ReelHeader = ({}: ReelHeaderProps) => {
  return (
    <div className="absolute top-0 left-0 right-0 p-4 pt-12 z-10">
      <div className="flex items-center justify-between text-white">
        <span className="text-lg font-semibold">Reels</span>
        <div className="w-6 h-6 bg-white/20 rounded-full"></div>
      </div>
    </div>
  );
};

export default ReelHeader;
