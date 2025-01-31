import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
// import { catchError, pluck, throwError } from 'rxjs';
import { getHistoriesReqDto } from '../dto/devops.req.dto';

@Injectable()
export class DevopsService {
    constructor(private readonly httpService: HttpService) {}

    async axiosGet(url: string) {
        try {
            const res: any = await this.httpService.axiosRef.get(url, {
                headers: { Cookie: 'dtstack=test' },
            });
            return res?.data?.data;
        } catch (error) {
            throw new HttpException('请求 devops 接口失败', HttpStatus.OK);
        }
    }

    /** 1、获取项目下的实例列表 */
    async getShiLis(devopsProjectIds: string[]) {
        const result = await Promise.all(
            devopsProjectIds.map((devopsProjectId: string) => {
                return this.axiosGet(
                    `http://devops.dtstack.cn/api/v1/workflowruns?project_id=${devopsProjectId}&page=1&limit=20&state=running`
                );
            })
        );
        return result.map((item: any) => item.list).flat(Infinity) || [];
    }

    /** 2、获取实例下的阶段列表 */
    async getStages(shiliId: number) {
        const res = await this.axiosGet(`http://devops.dtstack.cn/api/v1/workflowruns/${shiliId}`);
        return res?.stages || [];
    }

    /** 3、获取实例下的运行记录列表 */
    async getHistories(query: getHistoriesReqDto) {
        const { shiliId, stageId } = query;
        const res = await this.axiosGet(
            `http://devops.dtstack.cn/api/v1/stageruns?workflowrun_id=${shiliId}&stage=${stageId}&filter=success&limit=5&page=1`
        );
        return res?.list || [];
    }

    /** 4、实例下单条运行记录的详情 */
    async getHistory(historyId: number) {
        const { renderedContent = '' } = await this.axiosGet(
            `http://devops.dtstack.cn/api/v1/stageruns/${historyId}`
        );
        const [portalfront, str] =
            renderedContent
                ?.split('*****************************************')?.[0]
                ?.split('\nportalfront:')?.[1]
                ?.split('\nportalfront-doraemon:') || '';
        const uicfront = str.split('uicfront:')?.[1]?.replace(/\n/g, '');

        return {
            portalfront,
            uicfront,
            username: process.env.DEVOPS_USERNAME,
            password: process.env.DEVOPS_PASSWORD,
        };
    }

    // 5、获取实例下的详情 url, 相当于同时做了 2, 3, 4
    async getDevopsUrl(shiliId: number) {
        try {
            const stages = await this.getStages(shiliId);
            const histories = await this.getHistories({ shiliId, stageId: stages?.[0]?.id });
            const history = await this.getHistory(histories?.[0]?.id);
            return history;
        } catch (error) {
            throw new HttpException('请求 devops 接口失败', HttpStatus.OK);
        }
    }
}
