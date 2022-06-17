#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @Date  : 2022/6/24 12:00 下午
# @File  : 
# @Author: 
# @Desc  : 后台接口，对Client的数据进行承接，操作neo4j数据库

import time
import requests
from flask import Flask, request, jsonify, abort
from config import SPIDER_URL
from flask_cors import CORS
app = Flask(__name__)
CORS(app, supports_credentials=True)


def tmall_spider(keyword="资生堂"):
    """
    # 爬取天猫数据
    :rtype:
    """
    headers = {'user-agent': "okhttp/3.10.0.1", 'content-type': "application/json;charset='utf-8'"}
    url = SPIDER_URL
    data = {
        'keyword': keyword
    }
    text = {}
    count = 0
    while not text:
        response = requests.post(url, headers=headers, json=data)
        text = response.json()
        time.sleep(2)
        count += 1
        print(f"重试中, 重试第{count}次...")
    return text


@app.route('/api/labeled', methods=['POST'])
def labeled_data():
    """
    接收前端传过来的标注好的数据
    """
    json_dict = request.get_json()
    print(f"收到了用户提交的数据{json_dict}")
    result = {'status': 200, 'msg': 'success'}
    return jsonify(result)


@app.route("/ping", methods=['GET','POST'])
def ping():
    """
    测试
    :return:
    :rtype:
    """
    return jsonify("Pong")


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=2266, debug=True, threaded=True)