"use client";

import dynamic from "next/dynamic";

const Map2GIS = dynamic(() => import("./map"), { ssr: false });

export default Map2GIS;
