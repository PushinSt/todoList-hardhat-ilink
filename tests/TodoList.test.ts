import { expect, use } from "chai"
import { BigNumber } from "ethers"
import { ethers, waffle } from "hardhat"
import { prepareTodoListTokens, prepareSigners } from "./utils/prepare"
import { latest, increase, advanceBlock, duration } from "./utils/time"

use(waffle.solidity)

// Функция сравнения задачи
function compareTask(answer: any, nameTask: string, beginTime: BigNumber, endTime: BigNumber, runTime: BigNumber, isDeleted: boolean) {
  expect(answer[0]).to.eq(nameTask);
  expect(answer[1]).to.be.closeTo(beginTime, 1); //+-1
  expect(answer[2]).to.be.closeTo(endTime, 1); //+-1
  expect(answer[3]).to.eq(runTime);
  expect(answer[4]).to.eq(isDeleted);
}

describe("TodoList contract", function () {
  beforeEach(async function () {
    await prepareSigners(this)  // Сохраняем пользователей
    await prepareTodoListTokens(this, this.bob) // Публикуем контракт от имении Боба
  })

  describe("Deployment", function () {
    it("Contract address is correct", async function () {
      expect(this.token4.address).to.be.properAddress // Проверка, что адрес контракта корректный
    })

    it("Should have 0 tasks by default", async function () {
      expect(this.token4.tasks.length).to.eq(0) // Проверка, что при создании контракта нет задач
    })
  })

  describe("Action", function () {
    // Проверка создания задачи
    it("Check the creation of a task", async function () {
      // Создание первой задачи
      const nameTask = "First Task"
      const runTime = 120

      const nowTime = await latest(); // Фиксируем время создания
      await expect(this.token4.connect(this.alice).createTask(nameTask, runTime)) // Создание первой задачи
        .to.emit(this.token4, 'CreateTask') // Тестирование события создания
        .withArgs(0, this.alice.address, nameTask, runTime) // Аргументы события

      const answer = await this.token4.getOne(0) // Получение первой задачи
      // Проверка значений параметров первой задачи
      compareTask(answer, nameTask, nowTime, BigNumber.from(0), BigNumber.from(runTime), false);

      //создание второй задачи
      const nameTask2 = "Second Task"
      const runTime2 = 300
      const nowTime2 = await latest();
      await expect(this.token4.connect(this.alice).createTask(nameTask2, runTime2))  // Создание второй задачи
        .to.emit(this.token4, 'CreateTask') // Тестирование события создания
        .withArgs(1, this.alice.address, nameTask2, runTime2) // Аргументы события

      const answer2 = await this.token4.getOne(1) // Получение второй задачи
      // Проверка значений параметров второй задачи
      compareTask(answer2, nameTask2, nowTime2, BigNumber.from(0), BigNumber.from(runTime2), false);
    })

    //Проверка удаления
    it("Check the delete of a task", async function () {
      const nameTask = "First Task"
      const runTime = 120
      const nowTime = await latest();
      await this.token4.connect(this.alice).createTask(nameTask, runTime) // Создание тестовой задачи

      await expect(this.token4.connect(this.alice).deleteTask(0)) // Удаление задачи
        .to.emit(this.token4, 'DeleteTask') // Тестирование события удаления
        .withArgs(0, true) // Аргументы события

      const answer1 = await this.token4.getOne(0)  // Получение тестовой задачи
      // Проверка параметров задачи
      compareTask(answer1, nameTask, nowTime, BigNumber.from(0), BigNumber.from(runTime), true);

      await expect(this.token4.connect(this.alice).deleteTask(0)) // Восстановление задачи
        .to.emit(this.token4, 'DeleteTask') // Тестирование события удаления
        .withArgs(0, false) // Аргументы события

      const answer2 = await this.token4.getOne(0)  // Получение тестовой задачи
      // Проверка параметров задачи
      compareTask(answer2, nameTask, nowTime, BigNumber.from(0), BigNumber.from(runTime), false);

      await expect(this.token4.connect(this.bob).deleteTask(0)).to.be.reverted  // Проверка сработки require
      await expect(this.token4.connect(this.alice).deleteTask(100)).to.be.reverted  // Проверка сработки require
    })

    // Изменение статуса задачи
    it("Check the change of a task", async function () {
      const nameTask = "First Task"
      const runTime = 120
      const nowTime = await latest();
      await this.token4.connect(this.alice).createTask(nameTask, runTime) // Создание тестовой задачи

      const completeTime = await latest(); //Фиксируем время
      await expect(this.token4.connect(this.alice).completeTask(0)) // Выполнение тестовой задачи
        .to.emit(this.token4, 'CompleteTask') // Тестирование события выполнения
        .withArgs(0, true) // Аргументы события

      const answer1 = await this.token4.getOne(0)  // Получение тестовой задачи
      // Проверка параметров задачи
      compareTask(answer1, nameTask, nowTime, completeTime, BigNumber.from(runTime), false);

      await expect(this.token4.connect(this.alice).completeTask(0)) // Отмена выполнения тестовой задачи
        .to.emit(this.token4, 'CompleteTask') // Тестирование события выполнения
        .withArgs(0, false) // Аргументы события

      const answer2 = await this.token4.getOne(0)  // Получение тестовой задачи
      // Проверка параметров задачи
      compareTask(answer2, nameTask, nowTime, BigNumber.from(0), BigNumber.from(runTime), false);

      await expect(this.token4.connect(this.bob).completeTask(0)).to.be.reverted  // Проверка сработки require
      await expect(this.token4.connect(this.alice).completeTask(100)).to.be.reverted  // Проверка сработки require
    })
  })

  describe("Getter", function () {
    // Проверка функции получения процента выполненных задач
    it("Check the function get percent", async function () {
      await this.token4.connect(this.alice).createTask("One", 40) // создание тестовой задачи
      await this.token4.connect(this.alice).createTask("Two", 300) // создание тестовой задачи
      await this.token4.connect(this.bob).createTask("Three", 500) // создание тестовой задачи
      await this.token4.connect(this.alice).createTask("Four", 120) // создание тестовой задачи
      await this.token4.connect(this.tema).createTask("Five", 1000) // создание тестовой задачи

      expect(await this.token4.getPercent(this.alice.address)).to.eq(0) // проверка, что изначально 0 процентов
      await this.token4.connect(this.alice).completeTask(0) // выполнение задачи 0
      expect(await this.token4.getPercent(this.alice.address)).to.eq(33) // выполнена одна из трёх задач (в срок)

      await this.token4.connect(this.alice).completeTask(0) // Отменяем выполнение задачи 0
      await increase(duration.minutes("1")); // Проматываем время на 1 минуту вперед
      await this.token4.connect(this.alice).completeTask(0) // выполнение задачи 0
      expect(await this.token4.getPercent(this.alice.address)).to.eq(0) // Выполнено ноль задач из трёх (в срок)

      await this.token4.connect(this.alice).completeTask(1) // выполнение задачи 1
      expect(await this.token4.getPercent(this.alice.address)).to.eq(33) // выполнена одна из трёх задач (в срок)
      await this.token4.connect(this.alice).deleteTask(1) // удаление задачи 1
      expect(await this.token4.getPercent(this.alice.address)).to.eq(0) // Выполнено ноль задач из трёх (в срок)


      await expect(this.token4.getPercent(this.misha.address)).to.be.reverted  // Проверка сработки require
    })

    // Проверка функции получения задач
    it("Check the function get tasks for user", async function () {
      await this.token4.connect(this.alice).createTask("One", 40) // создание тестовой задачи
      await this.token4.connect(this.alice).createTask("Two", 300) // создание тестовой задачи
      await this.token4.connect(this.bob).createTask("Three", 500) // создание тестовой задачи
      await this.token4.connect(this.alice).createTask("Four", 120) // создание тестовой задачи
      await this.token4.connect(this.tema).createTask("Five", 1000) // создание тестовой задачи
      await this.token4.connect(this.alice).deleteTask(0) // удаление тестовой задачи

      const repsonse = await this.token4.getAllByOwner(this.alice.address) // Получить все задачи для Алисы
      expect(repsonse.length).to.eq(3)
      expect(repsonse[0]).to.eq(0)
      expect(repsonse[1]).to.eq(1)
      expect(repsonse[2]).to.eq(3)

      const repsonse2 = await this.token4.getAllByOwner(this.tema.address) // Получить все задачи для Тёмы
      expect(repsonse2.length).to.eq(1)
      expect(repsonse2[0]).to.eq(4)

      await expect(this.token4.getOne(100)).to.be.reverted  // Проверка сработки require
    })
  })

})