import { useEffect, useState } from "react";
import { useData } from "./useData";

export function useDayData(date: string) {
    let [dayData, setDayData] = useState<any>(null);
    const {getDocument, saveDocument} = useData();

    useEffect(() => {
        getDocument(date).then((data: any) => {
            setDayData(data);
        });
    }, [getDocument, date]);
    
    return {
        dayData,
        getDayData: async () => {
            return await getDocument(date);
        },
        saveDayData: async (data: any) => {
            return await saveDocument({
                id: date,
                ...data,
            });
        },
    };
}