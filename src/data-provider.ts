import { Observable } from 'rxjs'

/**
 * Provides data as a stream to the caller.
 */
export interface IDataProvider {

    /**
     * Returns an observable stream of data line-by-line.
     */
    get(): Observable<string>
}