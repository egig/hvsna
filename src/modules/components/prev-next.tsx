import { Link } from "react-router";
import { HvArrowLeft, HvArrowRight } from "@src/modules/icons";

export default function PrevNext({ prevLink, nextLink }: any) {
  return (
    <div className="fixed border-t border-gray-200 bg-white bottom-[65px] text-gray-600 left-0 right-0 p-2 flex justify-between">
      <Link className="w-8" to={prevLink}>
        <HvArrowLeft className="w-6 h-6" />
      </Link>
      <Link className="w-8" to={nextLink}>
        <HvArrowRight className="w-6 h-6" />
      </Link>
    </div>
  );
}
