import { 
    Vector 
} from "../../geometry";
import { 
    Grid, 
    GridItem 
} from "./grid";

export type MappedGridItemID = string;
export type MappedGridItemData = 
{
    id : MappedGridItemID;
};
export  class   MappedGrid<T extends MappedGridItemData = MappedGridItemData> 
        extends Grid<T>
{
    protected map : Map<MappedGridItemID, Vector> = new Map();
    override set = (cell : Vector, item : GridItem<T>) : void => 
    {
        this.grid[cell.y][cell.x] = item;
        this.map.set(item.data.id, cell);
    }
    getCell = (id : MappedGridItemID) : Vector | undefined => this.map.get(id);
    getItem = (id : MappedGridItemID) : GridItem<T | undefined> | undefined => 
        {
        const cell = this.getCell(id);
        if (!cell) return undefined;
        return this.grid[cell.y][cell.x];
    }
}

 