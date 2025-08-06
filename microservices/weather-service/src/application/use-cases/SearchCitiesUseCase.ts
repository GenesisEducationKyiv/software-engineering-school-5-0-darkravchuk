import { City } from '../../domain/value-objects/City';
import { IWeatherApiService } from '../../domain/repositories';

export interface SearchCitiesRequest {
  query: string;
  limit?: number;
}

export interface SearchCitiesResponse {
  cities: City[];
  totalFound: number;
}

export class SearchCitiesUseCase {
  private static readonly DEFAULT_SEARCH_LIMIT = 10;
  private static readonly MAX_SEARCH_LIMIT = 50;

  constructor(
    private readonly weatherApiService: IWeatherApiService
  ) {}

  async execute(request: SearchCitiesRequest): Promise<SearchCitiesResponse> {
    this.validateRequest(request);

    const limit = Math.min(
      request.limit || SearchCitiesUseCase.DEFAULT_SEARCH_LIMIT,
      SearchCitiesUseCase.MAX_SEARCH_LIMIT
    );

    try {
      const cities = await this.weatherApiService.searchCitiesByName(request.query, limit);
      
      return {
        cities,
        totalFound: cities.length
      };
    } catch (error) {
      throw new Error(`Failed to search cities: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private validateRequest(request: SearchCitiesRequest): void {
    if (!request.query || request.query.trim().length === 0) {
      throw new Error('Search query cannot be empty');
    }

    if (request.query.trim().length < 2) {
      throw new Error('Search query must be at least 2 characters long');
    }

    if (request.limit !== undefined && (request.limit < 1 || request.limit > SearchCitiesUseCase.MAX_SEARCH_LIMIT)) {
      throw new Error(`Search limit must be between 1 and ${SearchCitiesUseCase.MAX_SEARCH_LIMIT}`);
    }
  }
}
