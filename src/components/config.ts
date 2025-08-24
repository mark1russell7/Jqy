export class Config<T extends Record<string, any>> 
{
    public set<K extends keyof T>   (
                                        key     : K, 
                                        value   : T[K]
                                    ) : void 
    {
        this.settings[key] = value;
    }

    public get<K extends keyof T>   (
                                        key : K
                                    ) : T[K] 
    {
        return this.settings[key];
    }

    public reset<K extends keyof T> (
                                        key : K
                                    ) : void
    {
        this.settings[key] = this.defaults[key];
    }

    public resetAll() : void
    {
        this.settings = { ...this.defaults };
    }

    constructor (
                    private settings : T, 
                    private defaults : T = settings
                ) 
    {
        
    }
}