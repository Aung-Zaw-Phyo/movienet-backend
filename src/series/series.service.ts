import { Injectable } from '@nestjs/common';
import { Serie } from './entities/serie.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { paginate, PaginateConfig, Paginated, PaginateQuery } from 'nestjs-paginate';
import { throwCustomError } from 'src/common/helper';
import { EpisodesAdminService } from 'src/episodes/admin/episodes-admin.service';

@Injectable()
export class SeriesService {
    constructor(
        @InjectRepository(Serie) private serieRepository: Repository<Serie>,
        private readonly episodesAdminService: EpisodesAdminService,
    ) {}
    
    async findAll(query: PaginateQuery): Promise<Paginated<Serie>> {
        const config: PaginateConfig<Serie> = {
            sortableColumns: ['id', 'name'],
            maxLimit: 10,
            defaultSortBy: [['createdAt', 'DESC']],
        }
        query.limit = query.limit == 0 ? 10 : query.limit;
        const result = await paginate<Serie>(query, this.serieRepository, config);
        return result;
    }

    async findOne(id: number) {
        const serie = await this.serieRepository.findOne({where: {id}, relations: ['genres', 'seasons', 'episodes']});
        if(!serie) {
            throwCustomError("Serie not found.")
        }
        return serie;
    }

    async getEpisode(serieId: number, episodeId: number) {
        return this.episodesAdminService.getExactEpisode(serieId, episodeId);
    }

    async search(keyword: string) {
        const series = await this.serieRepository
                            .createQueryBuilder('serie')
                            .select(['serie.id', 'serie.name', 'serie.main_poster', 'serie.release_date'])
                            .where("serie.name LIKE :name", {name: `%${keyword}%`})
                            .getMany();
        return series;
    }
}
