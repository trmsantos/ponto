import {isEmpty} from 'ramda';

export const features = ({pagination={},sort={},filter={}}={})=>{
const _filter = {
    ...filter
};
/**
* { field, direction = "ASC"|"DESC" }
* [ { field, direction = "ASC"|"DESC" } ]
 */
const _sort = (() => {
    console.log("SORT", sort);
    const value=[];
    if (isEmpty(sort)){
            return value;
    }        
    if (Array.isArray(sort)) {
        for (var item of sort) {
            let { direction = 'ASC', ...rest } = item;
            if (!isEmpty(rest)){
                value.push({ direction, ...rest });
            }
        }
    } else {
        let { direction = 'ASC', ...rest } = sort;
        value.push({ direction, ...rest });
    }
    return value;
})();
const _pagination = {
    offset:0,
    page:1,
    pageSize:10,
    limit:0,
    ...pagination
};
return Object.seal({
    pagination:_pagination,
    sort:_sort,
    filter:_filter
});
}
