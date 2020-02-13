import { AuthenticationError, ApolloError, IResolvers } from 'apollo-server-koa';
import { getRepository } from 'typeorm';
import { normalize } from '../../lib/utils';
import { Series } from '../../entity/Series';
import { SeriesPosts } from '../../entity/SeriesPosts';

type EditSeriesArgs = {
  id: string;
  name: string;
  seriesOrder: string[];
};

async function getSeriesIfValid(seriesId: string, userId: string | null) {
  if (!userId) {
    throw new AuthenticationError('Not Logged In');
  }
  const seriesRepo = getRepository(Series);
  const series = await seriesRepo.findOne(seriesId);
  if (!series) {
    throw new ApolloError('Series not found', 'NOT_FOUND');
  }
  if (series.userId !== userId) {
    throw new ApolloError('This series is not yours', 'NO_PERMISSION');
  }

  return series;
}

export const resolvers: IResolvers = {
  Series: {
    seriesPosts: async (parent: Series, _: any, { loaders }) => {
      return loaders.seriesPosts.load(parent.id);
    },
    user: async (parent: Series, _: any, { loaders }) => {
      return loaders.user.load(parent.userId);
    },
    // thumbnail: async (parent: Series) => {
    //   const seriesPostRepo = getRepository(SeriesPosts);
    //   const seriesPost = await seriesPostRepo
    //     .createQueryBuilder('series_post')
    //     .leftJoinAndSelect('series_post.post', 'post')
    //     .where('series_post.index = 1')
    //     .andWhere('series_post.fk_series_id = :seriesId', { seriesId: parent.id })
    //     .getOne();
    //   if (!seriesPost) return null;
    //   return seriesPost.post.thumbnail;
    // },
    postsCount: async (parent: Series) => {
      const repo = getRepository(SeriesPosts);
      const count = await repo.count({
        where: {
          seriesId: parent.id,
        },
      });
      return count;
    },
  },
  Query: {
    series: async (_, { id, useremail, urlPath }) => {
      const seriesRepo = getRepository(Series);
      if (id) {
        const series = await seriesRepo.findOne(id);
        return series;
      }

      const series = await seriesRepo
        .createQueryBuilder('series')
        .leftJoinAndSelect('series.user', 'user')
        .where('user.useremail = :useremail', { useremail })
        .andWhere('series.url_slug = :url_slug', { urlPath })
        .getOne();

      return series;
    },
    seriesList: async (_, { useremail }) => {
      const seriesRepo = getRepository(Series);
      const seriesList = await seriesRepo
        .createQueryBuilder('series')
        .leftJoinAndSelect('series.user', 'user')
        .where('user.useremail = :useremail', { useremail })
        .orderBy('name')
        .getMany();
      return seriesList;
    },
  },
  Mutation: {
    createSeries: async (_, { name, urlPath }, { userId }) => {
      if (!userId) {
        throw new AuthenticationError('Not Logged In');
      }
      // const { name, urlPath } = args as CreateSeriesArgs;
      const seriesRepo = getRepository(Series);
      const exists = await seriesRepo.findOne({
        where: {
          name,
        },
      });
      if (exists) {
        throw new ApolloError('URL Slug already exists', 'ALREADY_EXISTS');
      }
      const series = new Series();
      series.userId = userId;
      series.name = name;
      series.urlPath = urlPath;
      await seriesRepo.save(series);
      return series;
    },
    appendToSeries: async (_, { seriesId, postId }, { userId }) => {
      // const { series_id, post_id } = args as AppendToSeriesArgs;
      await getSeriesIfValid(seriesId, userId);

      const seriesPostsRepo = getRepository(SeriesPosts);
      const seriesPostsList = await seriesPostsRepo.find({
        where: {
          seriesId,
        },
        order: {
          index: 'ASC',
        },
      });
      const exists = seriesPostsList.find(sp => sp.postId === postId);

      if (exists) {
        throw new ApolloError('Already added to series', 'CONFLICT');
      }

      const nextIndex =
        seriesPostsList.length === 0 ? 1 : seriesPostsList[seriesPostsList.length - 1].index + 1;

      // create new seriesPost
      const seriesPosts = new SeriesPosts();
      seriesPosts.postId = postId;
      seriesPosts.seriesId = seriesId;
      seriesPosts.index = nextIndex;

      // save
      await seriesPostsRepo.save(seriesPosts);
      return nextIndex;
    },
    editSeries: async (_, args, { userId }) => {
      const { id, name, seriesOrder } = args as EditSeriesArgs;
      const series = await getSeriesIfValid(id, userId);
      // update series name
      if (name !== series.name) {
        const seriesRepo = getRepository(Series);
        series.name = name;
        await seriesRepo.save(series);
      }

      // reorder series
      // validate series order
      const seriesPostsRepo = getRepository(SeriesPosts);
      const seriesPosts = await seriesPostsRepo.find({
        where: {
          seriesId: id,
        },
      });

      const valid =
        seriesPosts.every(sp => seriesOrder.includes(sp.id)) &&
        seriesPosts.length === seriesOrder.length;
      if (!valid) {
        throw new ApolloError('seriesOrder is invalid', 'BAD_REQUEST');
      }

      // figure out which data to update
      const seriesPostsById = normalize(seriesPosts, sp => sp.id);
      type Update = { id: string; index: number };
      const updates = seriesOrder.reduce<Update[]>((acc, current, index) => {
        const sp = seriesPostsById[current];
        console.log(sp.index, index + 1);
        if (sp.index !== index + 1) {
          // index mismatch
          acc.push({
            id: current,
            index: index + 1,
          });
          return acc;
        }
        return acc;
      }, []);

      // update every seriesPosts index where needed
      await Promise.all(
        updates.map(update => {
          const sp = seriesPostsById[update.id];
          sp.index = update.index;
          return seriesPostsRepo.save(sp);
        }),
      );

      return series;
    },
    removeSeries: async (_, { id }, { userId }) => {
      const seriesRepo = getRepository(Series);
      const series = await seriesRepo.findOne(id);
      if (!series) {
        throw new ApolloError('Series not found', 'NOT_FOUND');
      }
      if (series.userId !== userId) {
        throw new ApolloError('This series is not yours', 'NO_PERMISSION');
      }
      await seriesRepo.remove(series);
      return true;
    },
  },
};
