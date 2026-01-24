import { gregorianToHijri, hijriToGregorian } from "@tabby_ai/hijri-converter";

const Days = ["fri", "sat", "sun", "mon", "tue", "wed", "thu"]

export class HijriDate {
    year: number;
    month: number;
    day: number;
    dayOfWeek: number;
    _rawGregorianDate: Date;

    constructor(year: number, month: number, day: number, hour?: number, minute?: number, second?: number) {
        this.year = year;
        this.month = month;
        this.day = day;
        let d =  hijriToGregorian(this)
        this._rawGregorianDate = new Date(d.year, d.month-1, d.day, hour || 0, minute || 0, second || 0);
        this.dayOfWeek = Days.indexOf(this.format("dd").toLowerCase())
    }

    toDate(): Date {
        return this._rawGregorianDate;
    }

    static fromDate(date: Date) {
        const hijriDate = gregorianToHijri({
            year: date.getFullYear(),
            month: date.getMonth() + 1, // Month number in Javascript Date API is zero-based.
            day: date.getDate(),
        });

         return new HijriDate(hijriDate.year, hijriDate.month, hijriDate.day);
    }

    static fromGregorian(year: number, month?: number, day?: number, hour?: number, minute?: number, second?: number) {
        let date = new Date();
        if (!!month && !!year && !!day) {
            date = new Date(year, month-1, day, hour || 0, minute || 0, second || 0);
        }

       const hijriDate = gregorianToHijri({
            year: date.getFullYear(),
            month: date.getMonth() + 1, // Month number in Javascript Date API is zero-based.
            day: date.getDate(),
        });

        return new HijriDate(hijriDate.year, hijriDate.month, hijriDate.day, hour || 0, minute || 0, second || 0);
    }

    previous(): HijriDate {
        const prevGregorian = new Date(this._rawGregorianDate);
        prevGregorian.setDate(prevGregorian.getDate() - 1);
        
        const prevHijri = gregorianToHijri({
            year: prevGregorian.getFullYear(),
            month: prevGregorian.getMonth() + 1,
            day: prevGregorian.getDate(),
        });
        
        return new HijriDate(prevHijri.year, prevHijri.month, prevHijri.day);
    }

    next(): HijriDate {
        const nextGregorian = new Date(this._rawGregorianDate);
        nextGregorian.setDate(nextGregorian.getDate() + 1);
        
        const nextHijri = gregorianToHijri({
            year: nextGregorian.getFullYear(),
            month: nextGregorian.getMonth() + 1,
            day: nextGregorian.getDate(),
        });
        
        return new HijriDate(nextHijri.year, nextHijri.month, nextHijri.day);
    }

    startOfWeek(): HijriDate {
        // Get the day of week (0 = Sunday, 1 = Monday, ..., 5 = Friday, 6 = Saturday)
        // For Islamic calendar, Friday (day 5) is the start of the week
        const dayOfWeek = this._rawGregorianDate.getDay();
        
        // Calculate days to subtract to get to Friday
        // If it's Friday (5), subtract 0 days
        // If it's Saturday (6), subtract 1 day  
        // If it's Sunday (0), subtract 2 days
        // If it's Monday (1), subtract 3 days
        // If it's Tuesday (2), subtract 4 days
        // If it's Wednesday (3), subtract 5 days
        // If it's Thursday (4), subtract 6 days
        let daysToSubtract;
        if (dayOfWeek === 5) { // Friday
            daysToSubtract = 0;
        } else if (dayOfWeek === 6) { // Saturday
            daysToSubtract = 1;
        } else { // Sunday through Thursday
            daysToSubtract = dayOfWeek + 2;
        }
        
        const startOfWeekGregorian = new Date(this._rawGregorianDate);
        startOfWeekGregorian.setDate(startOfWeekGregorian.getDate() - daysToSubtract);
        
        const startOfWeekHijri = gregorianToHijri({
            year: startOfWeekGregorian.getFullYear(),
            month: startOfWeekGregorian.getMonth() + 1,
            day: startOfWeekGregorian.getDate(),
        });
        
        return new HijriDate(startOfWeekHijri.year, startOfWeekHijri.month, startOfWeekHijri.day);
    }

    format(formatString: string): string {
        const hijriMonthNames = [
            'Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani', 
            'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', 'Shaaban', 
            'Ramadan', 'Shawwal', 'Dhu al-Qidah', 'Dhu al-Hijjah'
        ];
        
        const hijriMonthShortNames = [
            'Muh', 'Saf', 'Rab1', 'Rab2', 'Jum1', 'Jum2', 'Raj', 'Sha', 'Ram', 'Shw', 'DhuQ', 'DhuH'
        ];
        
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayShortNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        
        const dayOfWeek = this._rawGregorianDate.getDay();
        const hours = this._rawGregorianDate.getHours();
        const minutes = this._rawGregorianDate.getMinutes();
        const seconds = this._rawGregorianDate.getSeconds();
        
        let result = formatString;
        
        // Replace exact token patterns (not word boundaries for time tokens)
        result = result.replace(/YYYY/g, this.year.toString());
        result = result.replace(/MMMM/g, hijriMonthNames[this.month - 1]);
        result = result.replace(/DDDD/g, this.getDayWithSuffix());
        result = result.replace(/dddd/g, dayNames[dayOfWeek]);
        result = result.replace(/Do/g, this.getDayWithSuffix());
        result = result.replace(/MMM/g, hijriMonthShortNames[this.month - 1]);
        result = result.replace(/ddd/g, dayShortNames[dayOfWeek]);
        result = result.replace(/YY/g, this.year.toString().slice(-2));
        result = result.replace(/MM/g, this.month.toString().padStart(2, '0'));
        result = result.replace(/DD/g, this.day.toString().padStart(2, '0'));
        result = result.replace(/HH/g, hours.toString().padStart(2, '0'));
        result = result.replace(/mm/g, minutes.toString().padStart(2, '0'));
        result = result.replace(/ss/g, seconds.toString().padStart(2, '0'));
        
        // Replace single character tokens only when they stand alone
        result = result.replace(/\bM\b/g, this.month.toString());
        result = result.replace(/\bD\b/g, this.day.toString());
        result = result.replace(/\bH\b/g, hours.toString());
        result = result.replace(/\bh\b/g, (hours % 12 || 12).toString());
        result = result.replace(/\bm\b/g, minutes.toString());
        result = result.replace(/\bs\b/g, seconds.toString());
        result = result.replace(/\ba\b/g, hours < 12 ? 'am' : 'pm');
        result = result.replace(/\bA\b/g, hours < 12 ? 'AM' : 'PM');
        result = result.replace(/\bdd\b/g, dayShortNames[dayOfWeek]);
        
        return result;
    }
    
    private getDayWithSuffix(): string {
        const day = this.day;
        if (day >= 11 && day <= 13) {
            return day + 'th';
        }
        switch (day % 10) {
            case 1: return day + 'st';
            case 2: return day + 'nd';
            case 3: return day + 'rd';
            default: return day + 'th';
        }
    }

    isToday(): boolean {
        const today = HijriDate.fromGregorian(
            new Date().getFullYear(),
            new Date().getMonth() + 1,
            new Date().getDate()
        );
        return this.year === today.year && 
               this.month === today.month && 
               this.day === today.day;
    }

    getWeekDates(): HijriDate[] {
        const sow = this.startOfWeek()
        const weekDates = [sow];
        for (let i = 0; i < 6; i++) {
            weekDates.push(weekDates[i].next());
        }
        return weekDates;
    }
}

export function isTodayHijriDate(hijriDate: HijriDate): boolean {
    const today = HijriDate.fromGregorian(
        new Date().getFullYear(),
        new Date().getMonth() + 1,
        new Date().getDate()
    );
    return hijriDate.year === today.year && 
           hijriDate.month === today.month && 
           hijriDate.day === today.day;
}

export function isSameHijriDate(date1: HijriDate, date2: HijriDate): boolean {
    return date1.year === date2.year && 
           date1.month === date2.month && 
           date1.day === date2.day;
}