import { Link } from "react-router";

export default function PrevNext({prevLink, nextLink}: any) {
    return <div className="navigation">
        <Link to={prevLink}>Prev</Link>
        <Link to={nextLink}>Next</Link>
      </div>
}