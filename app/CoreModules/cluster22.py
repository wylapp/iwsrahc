import pandas as pd
from io import BytesIO
import base64
import scipy.cluster.hierarchy as sch
import matplotlib
import matplotlib.pyplot as plt
import time, datetime
matplotlib.use('Agg')
import numpy as np
import os
import json
from lifelines import CoxPHFitter
import asyncio
import pymongo
from . import lifescatter
from app import utilities

class MyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        elif isinstance(obj, np.floating):
            return float(obj)
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        else:
            return super(MyEncoder, self).default(obj)


def clusterpack(genelist, uid, **kwargs):
    returndic = {}
    genelist = np.array(genelist)
    genelist = genelist + 2
    if len(kwargs) == 0:
        grid3 = pd.read_excel(os.path.join("app", "uploadfiles", str(uid) + ".xlsx"), index_col=0, header=0)
        asyncio.run(intodb(uid, "Local upload"))
    else:
        grid3 = pd.read_csv(os.path.join("app", "data", kwargs["type"], kwargs["text"] + ".csv"), index_col=0, header=0)
        asyncio.run(intodb(uid, '-'.join(['TCGA', kwargs["text"],  kwargs["type"]])))
    lifespan_name = grid3.columns[1]
    censor_name = grid3.columns[0]
    grid3 = grid3.sort_values(by=lifespan_name)
    projectNames = np.array(grid3._stat_axis.values.tolist())
    projectCensors = np.array(grid3.iloc[:, 0]).reshape((1, -1))[0]
    projectLife = np.array(grid3.iloc[:, 1]).reshape((1, -1))[0]
    genelist = np.insert(genelist, 0, [0, 1])
    grid3 = grid3.iloc[:, genelist]
    cph = CoxPHFitter()
    cph.fit(grid3, duration_col=lifespan_name, event_col=censor_name)
    betalist = cph.params_
    riskscore = np.array(
        [np.sum([betaVar * grid3.iloc[line, betaItem + 2] for betaItem, betaVar in enumerate(betalist)]) for
         line in range(grid3.shape[0])])
    # riskscore = np.exp(riskscore)
    # print(riskscore)
    # riskscore_O = np.array(riskscore).reshape((1, -1))
    riskscore_T = np.array(riskscore).reshape((-1, 1))
    distmap = sch.distance.pdist(riskscore_T, metric="chebyshev")
    mergings = sch.linkage(distmap, method="complete", optimal_ordering=True)
    # leaves = sch.leaves_list(sch.optimal_leaf_ordering(mergings, distmap)).tolist()

    # mergings = sch.linkage(distmap, method="complete")
    leaves = sch.leaves_list(mergings).tolist()
    # print("org",leaves)
    asyncio.run(intodb2(uid, grid3, leaves))
    # plt.axis('off')
    plt.figure(figsize=(15, 3), dpi=80)
    plt.axis('off')
    sch.dendrogram(mergings, no_labels=True)
    picIO = BytesIO()
    plt.savefig(picIO, format='png', bbox_inches='tight', pad_inches=0.0)
    data = base64.encodebytes(picIO.getvalue()).decode()
    # print('data:image/png;base64,' + str(data))
    returndic["dendro"] = 'data:image/png;base64,' + str(data)
    returndic["score"] = list(riskscore[leaves])
    returndic["names"] = list(projectNames[leaves])
    returndic["text"] = ['Sample name:' + returndic["names"][i] + '<br>Lifespan:' + str(list(projectLife[leaves])[i])
                         for i in range(len(returndic["names"]))]
    # returndic["censor"] = list(projectCensors[leaves])
    # returndic["life"] = list(projectLife[leaves])
    returndic["scatter"] = 'data:image/png;base64,' + str(
        lifescatter.survivalPlt(projectLife[leaves], projectCensors[leaves]))
    # print(returndic)
    return json.dumps(returndic, cls=MyEncoder)


async def intodb(uid:str, type:str) -> None:
    '''
    Record of each runtime and its statues.

    :param uid: the UUID of the running environment
    :param type: embedded TCGA dataset or local machine upload
    :return: None
    '''
    myclient = utilities.dburi.DBuri()
    mydb = myclient["cluster_record"]
    mycol = mydb["log"]
    mylog = {
        "uid": uid,
        "input": type,
        "time": time.strftime("%Y-%m-%d %H:%M:%S", time.gmtime(time.time())),
        "status": "Running"
    }
    mycol.insert_one(mylog)

async def intodb2(uid: str, grid: pd.DataFrame, leaves: list) -> None:
    '''
    This asynic Mongodb method inserts hierarchy cluster result into
    database, in purpose to accelerate re-cluster later.

    :param uid: UUID of the runtime
    :param grid: a pandas.dataframe. stores basic sample info.
    :param leaves: permuted sample ids according to linkage result.
    :return: None.
    '''
    myclient = utilities.dburi.DBuri()
    mydb = myclient["cluster_record"]
    mycol = mydb["proc_info"]
    my_query = {"uid": uid}
    myupdate = {"$set": {"dendrolist": leaves}}
    myfind = mycol.find(my_query)
    if myfind.count() > 0:
        mycol.update_one(my_query, myupdate)
    else:
        mydict = {
            "uid": uid,
            "state": list(grid.iloc[:, 0]),
            "life": list(grid.iloc[:, 1]),
            "dendrolist": leaves
        }
        mycol.insert_one(mydict)


if __name__ == "__main__":
    asyncio.run(clusterpack([2, 4]))
