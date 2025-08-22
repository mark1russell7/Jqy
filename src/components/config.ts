export class Config<T extends Record<string, any>> 
{
    public set<K extends keyof T>(key: K, value: T[K]) 
    {
        this.settings[key] = value;
    }

    public get<K extends keyof T>(key: K): T[K] 
    {
        return this.settings[key];
    }

    public reset<K extends keyof T>(key: K) 
    {
        this.settings[key] = this.defaults[key];
    }

    public resetAll() 
    {
        this.settings = { ...this.defaults };
    }

    constructor(private settings: T, private defaults : T = settings) 
    {
        
    }
}